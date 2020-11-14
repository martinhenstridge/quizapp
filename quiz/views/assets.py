from flask import send_from_directory
from ..quiz import Quiz
from .. import app


@app.route("/<quizid>/assets/<filename>")
def assets(quizid, filename):
    quiz = Quiz.get(quizid)
    return send_from_directory(
        quiz.assets, filename, mimetype=quiz.get_asset_mimetype(filename)
    )
