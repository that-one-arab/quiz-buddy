from celery import shared_task
from typing import List
from models import Quiz, Question, Answer
from app import db
from util.index import remove_files
from util.quizgpt.index import QuizGPT


@shared_task(bind=True, ignore_result=False)
def create_quiz(
    self,
    openai_api_key: str,
    subject_id: int,
    title: str,
    success_percentage: int,
    description: str,
    duration: int,
    number_of_questions: int,
    created_files_paths: List[str],
    user_ip: str,
):
    quiz = Quiz(
        subject_id=subject_id,
        title=title,
        success_percentage=success_percentage,
        description=description,
        duration=duration,
        user_ip=user_ip,
        is_shared=False,  # This can be updated by the user later
    )

    try:
        quiz_gpt = QuizGPT(
            openai_api_key=openai_api_key, celery_task=self, files=created_files_paths
        )
        questions, response_code, response_message = quiz_gpt.generate_questions(
            num_questions=number_of_questions
        )
        language_code, language_name = quiz_gpt.get_language()
        print("Language code: ", language_code)
        print("Language name: ", language_name)

        # If no questions were generated
        if len(questions) <= 0:
            remove_files(created_files_paths)
            return {
                "message": "Error during quiz creation",
                "quiz_id": None,
                "details": {
                    "response_message": response_message,
                    "response_code": response_code,
                },
            }

        # Save the questions and answers to the database
        for i, q in enumerate(questions):
            question = Question(title=q.title)
            for a in q.answers:
                answer = Answer(title=a.title, is_correct=a.is_correct)
                question.answers.append(answer)
            quiz.questions.append(question)

        # Save the quiz's language
        quiz.language = language_code

        db.session.add(quiz)
        db.session.commit()
        remove_files(created_files_paths)

        return {
            "message": "Quiz created successfully.",
            "quiz_id": quiz.id,
            "details": {
                "response_message": response_message,
                "response_code": response_code,
            },
        }

    except Exception as e:
        remove_files(created_files_paths)
        print("Error during quiz creation: ", str(e))
        # if error contains Incorrect API key provided
        if "Incorrect API key provided" in str(e):
            print("Incorrect API key provided")
            return {
                "message": "Error during quiz creation",
                "quiz_id": None,
                "details": {
                    "response_message": "Incorrect API key provided",
                    "response_code": 401,
                },
            }

        raise Exception(e)
