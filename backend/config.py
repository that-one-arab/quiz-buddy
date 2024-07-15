from dotenv import load_dotenv

load_dotenv()

import os


class Config(object):
    SECRET_KEY = os.environ.get("SECRET_KEY") or "you-will-never-guess"
    SQLALCHEMY_DATABASE_URI = os.environ.get("SQLALCHEMY_DATABASE_URI")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # Set to True to see SQL queries output in the console
    UPLOAD_DIR = os.environ.get("UPLOAD_DIR") or "/uploads"
    ALLOWED_EXTENSIONS = {"pdf", "txt", "md", "docx", "doc"}
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB limit
    CELERY = dict(
        broker_url=os.environ.get("CELERY_BROKER_URL") or "redis://localhost",
        result_backend=os.environ.get("CELERY_RESULT_BACKEND") or "redis://localhost",
        task_ignore_result=True,
    )
