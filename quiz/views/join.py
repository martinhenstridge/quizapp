from flask import redirect, render_template, request, session, url_for
from ..quiz import Quiz
from .. import app


@app.route("/<quizid>/join/<team>", methods=["GET", "POST"])
def join(quizid, team):
    quiz = Quiz.get(quizid)

    if request.method == "GET":
        return render_template("join.html", quizid=quizid, team=team)

    player = request.form["player"]
    session["team"] = team
    session["player"] = player

    dest = url_for("play", quizid=quizid, team=team)
    return redirect(dest)

