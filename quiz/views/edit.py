from flask import redirect, render_template, url_for
from .quiz import Quiz


def page(inst):
    purl = url_for("handler_edit_players", inst=inst)
    qurl = url_for("handler_edit_questions", inst=inst)
    return render_template("edit.html", purl=purl, qurl=qurl)


def page_players(inst):
    quiz = Quiz.get(inst)
    return render_template("edit_players.html", players=quiz.players)


def page_questions(inst):
    return f"[{inst}] EDIT QUESTIONS HERE..."


def post_edit_players_add(inst, name, team):
    quiz = Quiz.get(inst)
    quiz.add_player(name, team)
    return render_template("edit_players.html", players=quiz.players)
