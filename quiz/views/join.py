from flask import redirect, render_template, request, session, url_for
from ..quiz import Quiz
from .. import app


@app.route("/<quizid>/join/", methods=["GET", "POST"])
def join(quizid):
    quiz = Quiz.get(quizid)

    if request.method == "GET":
        return render_template("join.html", quizid=quizid, teams=quiz.teams)

    team = request.form["team"]
    dest = url_for("identify", quizid=quizid, team=team)
    return redirect(dest)


@app.route("/<quizid>/join/<team>", methods=["GET", "POST"])
def identify(quizid, team):
    quiz = Quiz.get(quizid)

    if request.method == "GET":
        return render_template("identify.html", quizid=quizid, team=team)

    session["team"] = team
    session["player"] = request.form["name"]

    dest = url_for("play", quizid=quizid)
    return redirect(dest)
