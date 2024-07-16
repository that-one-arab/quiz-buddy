from app import db
from sqlalchemy.orm import relationship
from util.index import BaseModel


class Answer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    is_correct = db.Column(db.Boolean, default=False)
    question_id = db.Column(db.Integer, db.ForeignKey("question.id"), nullable=False)


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), nullable=False)
    answers = relationship("Answer", backref="question", cascade="all, delete-orphan")


class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)


class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    title = db.Column(db.String(255), nullable=False)
    success_percentage = db.Column(db.Integer, nullable=False)
    description = db.Column(db.String(1024))
    duration = db.Column(db.Integer, nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subject.id"), nullable=False)
    subject = relationship("Subject", backref="quizzes")
    questions = relationship("Question", backref="quiz", cascade="all, delete-orphan")
    user_ip = db.Column(db.String(255), nullable=False)
    is_shared = db.Column(db.Boolean, default=False)
    language = db.Column(db.String(7), nullable=False)
    is_quiz_buddy_original = db.Column(db.Boolean, default=False)


class UserChoice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("question.id"), nullable=False)
    choice_id = db.Column(db.Integer, db.ForeignKey("answer.id"), nullable=True)
    quiz_attempt_id = db.Column(
        db.Integer, db.ForeignKey("quiz_attempt.id"), nullable=False
    )
    question = relationship("Question", backref="user_choices")
    choice = relationship("Answer", backref="user_choices")


class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), nullable=False)
    quiz = relationship("Quiz", backref="attempts")
    result = db.Column(db.Integer, nullable=False)
    did_pass = db.Column(db.Boolean, nullable=False)
    answered_questions = relationship(
        "UserChoice", backref="quiz_attempt", cascade="all, delete-orphan"
    )
