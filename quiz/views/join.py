from flask import flash, redirect, render_template, request, session, url_for
from ..quiz import Quiz
from .. import app


@app.route("/<quizid>/join/", methods=["GET", "POST"])
def join(quizid):
    quiz = Quiz.get(quizid)

    if request.method == "GET":
        return render_template("join.html", quizid=quizid, teams=quiz.teams)

    team = request.form["team"]
    dest = url_for("auth", quizid=quizid, team=team)
    return redirect(dest)


@app.route("/<quizid>/join/<team>", methods=["GET", "POST"])
def auth(quizid, team):
    quiz = Quiz.get(quizid)

    if request.method == "GET":
        return render_template("auth.html", quizid=quizid, team=team)

    player = request.form["name"]
    password = request.form["token"]

    # On incorrect password redirect to same page with flashed message.
    if not quiz.check_team_password(team, password.upper()):
        flash(f"Incorrect password for team {team}")
        dest = url_for("auth", quizid=quizid, team=team)
        return redirect(dest)

    session.clear()
    session["quizid"] = quizid
    session["team"] = team
    session["player"] = player

    dest = url_for("play", quizid=quizid)
    return redirect(dest)
