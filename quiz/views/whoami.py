from flask import redirect, render_template, request, session, url_for
from ..quiz import Quiz
from .. import app


@app.route("/<quizid>/whoami")
def whoami(quizid):
    team = session.get("team", "?")
    player = session.get("player", "?")

    return render_template("whoami.html", quizid=quizid, team=team, player=player)

