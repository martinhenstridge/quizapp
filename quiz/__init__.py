from flask import Flask
from .quiz import Quiz

app = Flask(__name__, instance_relative_config=True)
app.config.from_pyfile("config.py")

Quiz.STORAGE = app.config["STORAGE"]

# Register route handlers.
from . import views
