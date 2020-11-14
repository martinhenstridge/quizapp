from flask import send_from_directory
from ..quiz import Quiz
from .. import app


@app.route("/<quizid>/assets/<asset>")
def assets(quizid, asset):
    quiz = Quiz.get(quizid)
    return send_from_directory(
        quiz.assets, asset, mimetype=quiz.get_asset_mimetype(asset)
    )
