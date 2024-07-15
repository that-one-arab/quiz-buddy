import os
from typing import List
from datetime import datetime
from sqlalchemy import Column, DateTime, event
from app import db, app


class BaseModel(db.Model):
    __abstract__ = True  # This ensures the class is not created as a table

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    modified_at = Column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    @staticmethod
    def set_created_at(mapper, connection, target):
        if not target.created_at:
            target.created_at = datetime.utcnow()

    @staticmethod
    def set_modified_at(mapper, connection, target):
        target.modified_at = datetime.utcnow()

    @classmethod
    def __declare_last__(cls):
        event.listen(cls, "before_insert", cls.set_created_at)
        event.listen(cls, "before_update", cls.set_modified_at)


def get_file_extension(filename: str):
    """
    Get the file extension from the filename
    """
    return filename.rsplit(".", 1)[1].lower()


def allowed_file(filename: str):
    """
    Check if the file extension is allowed
    """
    return (
        "." in filename
        and get_file_extension(filename) in app.config["ALLOWED_EXTENSIONS"]
    )


def remove_files(files: List[str]):
    """
    Remove files from the file system
    """
    for file in files:
        os.remove(file)
