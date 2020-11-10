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
    quiz = Quiz.get(key)
    return render_template("edit_questions.html", questions=quiz.questions)


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


def post_questions_add(key, data):
    text = data["text"]
    answer = data["answer"]

    quiz = Quiz.get(key)
    quiz.add_question(text, answer)

    dest = url_for("handler_edit_questions", key=key)
    return redirect(dest)


def post_questions_update_text(key, data):
    number = data["number"]
    text = data["text"]

    quiz = Quiz.get(key)
    quiz.update_question_text(number, text)

    dest = url_for("handler_edit_questions", key=key)
    return redirect(dest)


def post_questions_update_answer(key, data):
    number = data["number"]
    answer = data["answer"]

    quiz = Quiz.get(key)
    quiz.update_question_answer(number, answer)

    dest = url_for("handler_edit_questions", key=key)
    return redirect(dest)


def post_questions_remove(key, data):
    number = data["number"]

    quiz = Quiz.get(key)
    quiz.remove_question(number)

    dest = url_for("handler_edit_questions", key=key)
    return redirect(dest)
