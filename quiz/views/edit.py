from flask import redirect, render_template, url_for
from ..quiz import Quiz


def page(key):
    purl = url_for("handler_edit_players", key=key)
    qurl = url_for("handler_edit_questions", key=key)
    return render_template("edit.html", purl=purl, qurl=qurl)


def page_players(key):
    quiz = Quiz.get(key)
    return render_template("edit_players.html", players=quiz.players)


def page_questions(key):
    return f"[{key}] EDIT QUESTIONS HERE..."


def post_players_add(key, data):
    name = data["name"]
    team = data["team"]

    quiz = Quiz.get(key)
    quiz.add_player(name, team)

    dest = url_for("handler_edit_players", key=key)
    return redirect(dest)


def post_players_update(key, data):
    name = data["name"]
    team = data["team"]

    quiz = Quiz.get(key)
    quiz.update_player(name, team)

    dest = url_for("handler_edit_players", key=key)
    return redirect(dest)


def post_players_remove(key, data):
    name = data["name"]

    quiz = Quiz.get(key)
    quiz.remove_player(name)

    dest = url_for("handler_edit_players", key=key)
    return redirect(dest)
