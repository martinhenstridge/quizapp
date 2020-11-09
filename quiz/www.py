from flask import Flask, request
from . import api, views
from .quiz import Quiz


def create_app():
    app = Flask(__name__)

    @app.route("/")
    def handler_home():
        return "Welcome!\n"

    @app.route("/new", methods=["GET", "POST"])
    def handler_quiz_new():
        if request.method == "GET":
            return views.page_new()
        if request.method == "POST":
            return views.post_new(request.form["inst"])

    @app.route("/edit/<inst>")
    def handler_quiz_edit(inst):
        quiz = Quiz.get(inst)
        return views.edit(quiz)

    @app.route("/play/<inst>/")
    def handler_quiz_home(inst):
        quiz = Quiz.get(inst)
        return views.home(quiz)

    @app.route("/play/<inst>/<name>")
    def handler_quiz_play(inst, name):
        quiz = Quiz.get(inst)
        return views.play(quiz, name)

    @app.route("/api", methods=["POST"])
    def handler_quiz_api():
        #quiz = Quiz.lookup(inst)
        #return api.handle(quiz, request.json)
        return None

    return app
