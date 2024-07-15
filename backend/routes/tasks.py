from flask import Blueprint
from celery.result import AsyncResult

tasks_blueprint = Blueprint("tasks", __name__, url_prefix="/api")


@tasks_blueprint.get("/result/<id>")
def task_result(id: str) -> dict[str, object]:
    result = AsyncResult(id)
    response = {
        "ready": result.ready(),
        "successful": result.successful(),
        "value": result.result if result.ready() else None,
    }

    # Incorrect OpenAI API key provided
    if (
        response["ready"]
        and "Incorrect API key provided"
        in response["value"]["details"]["response_message"]
    ):
        response["successful"] = False
        response["value"] = {
            "message": "Error during quiz creation",
            "quiz_id": None,
            "details": {
                "response_message": "Incorrect API key provided",
                "response_code": 401,
            },
        }

    if result.state == "PROGRESS":
        response["progress"] = result.info

    return response
