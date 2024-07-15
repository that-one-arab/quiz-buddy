from flask import Flask, Blueprint
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config
from celery_util import celery_init_app

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)

celery_app = celery_init_app(app)
celery_app.autodiscover_tasks()

# Initialize the database
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Import models and routes
from models import Answer, Question, Subject, Quiz, UserChoice, QuizAttempt


# Import blueprints
from routes.quizzing import quizzing_blueprint
from routes.tasks import tasks_blueprint

# Register blueprints
# Blueprint for the API (root URL: /api)
api_blueprint = Blueprint("api", __name__)

api_blueprint.register_blueprint(quizzing_blueprint, url_prefix="/quizzing")
api_blueprint.register_blueprint(tasks_blueprint, url_prefix="/tasks")

# Register the root API blueprint with the app
app.register_blueprint(api_blueprint, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True)
