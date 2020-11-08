from flask import Flask
from . import api, views
from .quiz import Quiz


def create_app():
    app = Flask(__name__)

    @app.route("/")
    def handler_home():
        return "Welcome!\n"

    @app.route("/quiz/edit/<inst>/")
    def handler_quiz_edit(inst):
        quiz = Quiz.ensure(inst)
        return views.edit(quiz)

    @app.route("/quiz/play/<inst>/")
    def handler_quiz_home(inst):
        quiz = Quiz.lookup(inst)
        return views.home(quiz)

    @app.route("/quiz/play/<inst>/<name>")
    def handler_quiz_play(inst, name):
        quiz = Quiz.lookup(inst)
        return views.play(quiz, name)

    @app.route("/quiz/api/<inst>", methods=["POST"])
    def handler_quiz_api(inst):
        quiz = Quiz.lookup(inst)
        return api.handle(quiz, request.json)

    return app
