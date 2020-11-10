from collections import defaultdict
from flask import render_template, url_for
from ..quiz import Quiz


def page(key):
    quiz = Quiz.get(key)
    teams = defaultdict(list)
    for name, team in quiz.players:
        url = url_for("handler_play_player", key=key, name=name)
        teams[team].append((name, url))
    return render_template("play.html", key=key, teams=teams)


def page_player(key, player):
    return f"[{key}:{player}] PLAY HERE..."
