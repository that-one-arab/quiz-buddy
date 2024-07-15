import os
from flask import Blueprint, jsonify, request
from app import db, app
from werkzeug.utils import secure_filename
from util.index import allowed_file, get_file_extension, remove_files
from models import Quiz, Question, Answer, Subject, QuizAttempt, UserChoice
from uuid import uuid4
import tasks
from sqlalchemy import desc, and_, or_
from base64 import b64encode, b64decode
import json

quizzing_blueprint = Blueprint("quizzing", __name__, url_prefix="/api")


# Get Subjects
@quizzing_blueprint.route("/subjects", methods=["GET"])
def get_subjects():
    search_query = request.args.get("search_query")
    subjects = Subject.query
    if search_query:
        # escape any single or doble quotes in the search query
        search_query = search_query.replace("'", "").replace('"', "")
        subjects = subjects.filter(Subject.title.ilike(f"%{search_query}%"))
    subjects_data = [{"id": s.id, "title": s.title} for s in subjects.all()]
    return jsonify(subjects_data)


@quizzing_blueprint.route("/subjects/<int:subject_id>", methods=["GET"])
def get_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)

    return jsonify({"id": subject.id, "title": subject.title})


# Create Subject
@quizzing_blueprint.route("/subjects", methods=["POST"])
def create_subject():
    data = request.get_json()
    title = data.get("title")

    subject = Subject(title=title)
    db.session.add(subject)
    db.session.commit()

    return (
        jsonify({"message": "Subject created successfully!", "subject_id": subject.id}),
        201,
    )


# Edit Subject
@quizzing_blueprint.route("/subjects/<int:subject_id>", methods=["PUT"])
def edit_subject(subject_id):
    data = request.get_json()
    new_title = data.get("new_title")

    if not new_title:
        return jsonify({"error": "Key 'new_title' is required!"}), 400

    subject = Subject.query.get_or_404(subject_id)

    subject.title = new_title
    db.session.commit()

    return jsonify({"message": "Subject updated successfully!"}), 200


# Delete Subject
@quizzing_blueprint.route("/subjects/<int:subject_id>", methods=["DELETE"])
def delete_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    db.session.delete(subject)
    db.session.commit()
    return (
        jsonify({"message": "Subject and related quizzes deleted successfully!"}),
        200,
    )


# TODO: Implement this route
# # Get supported file types for quiz files
# @quizzing_blueprint.route("/supported-file-types", methods=["GET"])
# def get_file_types():
#     return jsonify({"file_types": app.config["ALLOWED_EXTENSIONS"]})


# Create Quiz
@quizzing_blueprint.route("/quizzes", methods=["POST"])
def create_quiz():
    # Used for error handling and/or cleanup
    created_files_paths = []

    files = request.files.getlist("file")

    data = request.form.to_dict()

    openai_api_key = data.get("openai_api_key")

    subject_id = data.get("subject_id")
    title = data.get("title")
    success_percentage = data.get("success_percentage")
    description = data.get("description")
    duration = data.get("duration")
    number_of_questions = data.get("number_of_questions")
    number_of_questions = int(number_of_questions) if number_of_questions else 0

    try:
        # Make sure the subject exists
        Subject.query.get_or_404(subject_id)
    except:
        return jsonify({"error": "Invalid subject id"}), 400

    if len(files) <= 0:
        return jsonify({"message": "No files part in the request"}), 400

    # Files validation
    for file in files:
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if not file.filename:
            remove_files(created_files_paths)
            return jsonify({"message": "No selected file"}), 400

        if file and not allowed_file(file.filename):
            remove_files(created_files_paths)
            return (
                jsonify(
                    {
                        "error": "Invalid file extension, supported extensions are: "
                        + app.config["ALLOWED_EXTENSIONS"]
                    }
                ),
                400,
            )

    # Save files
    for file in files:
        if file:
            filename = secure_filename(file.filename)
            filename = str(uuid4()) + "." + get_file_extension(file.filename)

            file_path = os.path.join(app.config["UPLOAD_DIR"], filename)

            file.save(file_path)
            created_files_paths.append(file_path)

    # Associate each quiz with the user's IP address to block users/quizzes that may be harmful or inappropriate
    user_ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    task = tasks.create_quiz.delay(
        openai_api_key,
        subject_id,
        title,
        success_percentage,
        description,
        duration,
        number_of_questions,
        created_files_paths,
        user_ip,
    )

    return jsonify({"task_id": task.id}), 202


from sqlalchemy import desc


# Get Quizzes
@quizzing_blueprint.route("/quizzes", methods=["GET"])
def get_quizzes():
    search_query = request.args.get("search_query")
    subject_id = request.args.get("subject_id")
    language = request.args.get("language")
    cursor = request.args.get("cursor")
    limit = request.args.get("limit", 12, type=int)

    quizzes = Quiz.query.filter_by(is_shared=True)

    if search_query:
        search_query = search_query.replace("'", "").replace('"', "")
        quizzes = quizzes.filter(
            or_(
                Quiz.title.ilike(f"%{search_query}%"),
                Quiz.description.ilike(f"%{search_query}%"),
            )
        )

    if subject_id:
        quizzes = quizzes.filter_by(subject_id=subject_id)

    if language:
        quizzes = quizzes.filter_by(language=language)

    # Order by id descending (assuming newest first)
    quizzes = quizzes.order_by(desc(Quiz.id))

    # Apply cursor if provided
    if cursor:
        cursor_data = json.loads(b64decode(cursor))
        last_id = cursor_data.get("last_id")
        if last_id:
            quizzes = quizzes.filter(Quiz.id < last_id)

    # Fetch one extra to determine if there are more results
    quizzes = quizzes.limit(limit + 1).all()

    has_more = len(quizzes) > limit
    quizzes = quizzes[:limit]  # Trim to requested limit

    quizzes_data = [
        {
            "id": q.id,
            "subject_id": q.subject_id,
            "subject_title": q.subject.title,
            "title": q.title,
            "success_percentage": q.success_percentage,
            "description": q.description,
            "duration": q.duration,
            "number_of_questions": len(q.questions),
        }
        for q in quizzes
    ]

    # Create the next cursor
    next_cursor = None
    if has_more and quizzes:
        last_quiz = quizzes[-1]
        cursor_data = {"last_id": last_quiz.id}
        next_cursor = b64encode(json.dumps(cursor_data).encode()).decode()

    response = {
        "quizzes": quizzes_data,
        "has_more": has_more,
        "next_cursor": next_cursor,
    }

    return jsonify(response)


# Get Quiz
@quizzing_blueprint.route("/quizzes/<int:quiz_id>", methods=["GET"])
def get_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)

    user_ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    if not quiz.is_shared:
        if quiz.user_ip != user_ip:
            return (
                jsonify({"error": "You do not have permission to view this quiz"}),
                403,
            )

    return jsonify(
        {
            "id": quiz.id,
            "subject_id": quiz.subject_id,
            "title": quiz.title,
            "success_percentage": quiz.success_percentage,
            "description": quiz.description,
            "duration": quiz.duration,
            "questions": [
                {
                    "id": q.id,
                    "title": q.title,
                    "answers": [
                        {"id": a.id, "title": a.title, "is_correct": a.is_correct}
                        for a in q.answers
                    ],
                }
                for q in quiz.questions
            ],
            "language": quiz.language,
            "can_delete": quiz.user_ip == user_ip and not quiz.is_quiz_buddy_original,
        }
    )


# Delete Quiz
@quizzing_blueprint.route("/quizzes/<int:quiz_id>", methods=["DELETE"])
def delete_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)

    if quiz.is_quiz_buddy_original:
        return jsonify({"error": "You cannot delete this quiz"}), 403

    user_ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    if quiz.user_ip != user_ip:
        return jsonify({"error": "You do not have permission to delete this quiz"}), 403

    try:
        db.session.begin_nested()

        for q in quiz.questions:
            UserChoice.query.filter_by(question_id=q.id).delete()
            Answer.query.filter_by(question_id=q.id).delete()

        Question.query.filter_by(quiz_id=quiz_id).delete()

        QuizAttempt.query.filter_by(quiz_id=quiz_id).delete()

        db.session.delete(quiz)
        db.session.commit()

        return jsonify({"message": "Quiz deleted successfully!"}), 200

    except Exception as e:
        db.session.rollback()
        raise e


# Create Quiz Attempt
@quizzing_blueprint.route("/quizzes/<int:quiz_id>/attempt", methods=["POST"])
def create_quiz_attempt(quiz_id):
    data = request.get_json()
    answered_questions = data.get("answered_questions")

    quiz = Quiz.query.get_or_404(quiz_id)
    quiz_attempt = QuizAttempt(quiz_id=quiz.id, result=0, did_pass=False)

    total_correct = 0
    for q in answered_questions:
        question_id = q["question_id"]
        choice_id = q["choice_id"]

        question = Question.query.get_or_404(question_id)
        answer = None
        # If time runs out, user may not answer all questions, so answer may be None
        if choice_id:
            answer = Answer.query.get_or_404(choice_id)

        if not answer:
            quiz_attempt.answered_questions.append(
                UserChoice(question_id=question.id, choice_id=None)
            )
        else:
            if answer.question_id != question.id:
                return jsonify({"error": "Invalid choice for the question"}), 400

            quiz_attempt.answered_questions.append(
                UserChoice(question_id=question.id, choice_id=answer.id)
            )

            if answer.is_correct:
                total_correct += 1

    quiz_attempt.result = total_correct * 100 // len(quiz.questions)

    quiz_attempt.did_pass = quiz_attempt.result >= quiz.success_percentage

    db.session.add(quiz_attempt)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Quiz attempt created successfully!",
                "attempt_id": quiz_attempt.id,
            }
        ),
        201,
    )


# Get Quiz Attempt
@quizzing_blueprint.route(
    "/quizzes/<int:quiz_id>/attempts/<int:attempt_id>", methods=["GET"]
)
def get_quiz_attempt(quiz_id, attempt_id):
    quiz_attempt = QuizAttempt.query.get_or_404(attempt_id)
    if quiz_attempt.quiz_id != quiz_id:
        return jsonify({"error": "Invalid quiz attempt"}), 400

    quiz = Quiz.query.get_or_404(quiz_id)

    def get_choice(question: Question):
        for q in quiz_attempt.answered_questions:

            if q.question_id == question.id:
                if not q.choice_id:
                    return None

                answer = Answer.query.get(q.choice_id)
                return {
                    "id": answer.id,
                    "title": answer.title,
                    "is_correct": answer.is_correct,
                }
        return None

    def get_correct_choice(question: Question):
        for a in question.answers:
            if a.is_correct:
                return {
                    "id": a.id,
                    "title": a.title,
                    "is_correct": a.is_correct,
                }
        return None

    questions = [
        {
            "id": q.id,
            "title": q.title,
            "answers": [
                {"id": a.id, "title": a.title, "is_correct": a.is_correct}
                for a in q.answers
            ],
            "choice": get_choice(q),
            "correct_choice": get_correct_choice(q),
        }
        for q in quiz.questions
    ]

    return jsonify(
        {
            "id": quiz_attempt.id,
            "quiz_id": quiz_attempt.quiz_id,
            "result": quiz_attempt.result,
            "did_pass": quiz_attempt.did_pass,
            "success_percentage": quiz_attempt.quiz.success_percentage,
            "questions": questions,
            "is_shared": quiz.is_shared,
        }
    )


@quizzing_blueprint.route("/quizzes/<int:quiz_id>/share", methods=["PUT"])
def share_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)

    user_ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    # Since we don't have user authentication, we'll use the user's IP address to verify ownership.
    if quiz.user_ip != user_ip:
        return jsonify({"error": "You do not have permission to share this quiz"}), 403

    if quiz.is_shared == True:
        return jsonify({"error": "Quiz is already shared"}), 400

    quiz.is_shared = True
    db.session.commit()

    return jsonify({"message": "Quiz shared status updated successfully!"}), 200
