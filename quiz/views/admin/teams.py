from flask import redirect, render_template, request, url_for
from ...quiz import Quiz
from ... import app


@app.route("/<quizid>/admin/teams/")
def edit_teams(quizid):
    quiz = Quiz.get(quizid)
    return render_template("admin/teams.html", quizid=quizid, teams=quiz.teams)


@app.route("/<quizid>/admin/teams/add", methods=["POST"])
def _teams_add(quizid):
    notes = request.form["notes"]

    quiz = Quiz.get(quizid)
    quiz.add_team(notes)

    dest = url_for("edit_teams", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/teams/update", methods=["POST"])
def _teams_update(quizid):
    number = request.form["number"]
    notes = request.form["notes"]

    quiz = Quiz.get(quizid)
    quiz.update_team(number, notes)

    dest = url_for("edit_teams", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/teams/remove", methods=["POST"])
def _teams_remove(quizid):
    number = request.form["number"]

    quiz = Quiz.get(quizid)
    quiz.remove_team(number)

    dest = url_for("edit_teams", quizid=quizid)
    return redirect(dest)
