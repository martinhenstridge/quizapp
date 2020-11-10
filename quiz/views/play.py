from collections import defaultdict
from flask import render_template, url_for
from ..quiz import Quiz
from .. import app


@app.route("/play/<key>/")
def play(key):
    quiz = Quiz.get(key)
    teams = defaultdict(list)
    for name, team in quiz.players:
        url = url_for("play_player", key=key, name=name)
        teams[team].append((name, url))
    return render_template("play.html", key=key, teams=teams)


@app.route("/play/<key>/as/<name>")
def play_player(key, name):
    return f"[{key}:{name}] PLAY HERE..."
