from flask import render_template, session
from .. import app


@app.route("/whoami")
def whoami():
    quizid = session.get("quizid")
    team = session.get("team")
    player = session.get("player")

    if quizid is None or team is None or player is None:
        quizid = team = player = None

    return render_template("whoami.html", quizid=quizid, team=team, player=player)
