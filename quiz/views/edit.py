from flask import redirect, render_template, request, url_for
from ..quiz import Quiz
from .. import app


@app.route("/edit/<key>/")
def edit(key):
    purl = url_for("edit_players", key=key)
    qurl = url_for("edit_questions", key=key)
    return render_template("edit.html", key=key, purl=purl, qurl=qurl)


@app.route("/edit/<key>/players/")
def edit_players(key):
    quiz = Quiz.get(key)
    return render_template("edit_players.html", players=quiz.players)


@app.route("/edit/<key>/questions/")
def edit_questions(key):
    quiz = Quiz.get(key)
    return render_template("edit_questions.html", questions=quiz.questions)


@app.route("/edit/<key>/players/add", methods=["POST"])
def _players_add(key):
    name = request.form["name"]
    team = request.form["team"]

    quiz = Quiz.get(key)
    quiz.add_player(name, team)

    dest = url_for("edit_players", key=key)
    return redirect(dest)


@app.route("/edit/<key>/players/update", methods=["POST"])
def _players_update(key):
    name = request.form["name"]
    team = request.form["team"]

    quiz = Quiz.get(key)
    quiz.update_player(name, team)

    dest = url_for("edit_players", key=key)
    return redirect(dest)


@app.route("/edit/<key>/players/remove", methods=["POST"])
def _players_remove(key):
    name = request.form["name"]

    quiz = Quiz.get(key)
    quiz.remove_player(name)

    dest = url_for("edit_players", key=key)
    return redirect(dest)


@app.route("/edit/<key>/questions/add", methods=["POST"])
def _questions_add(key):
    text = request.form["text"]
    answer = request.form["answer"]

    quiz = Quiz.get(key)
    quiz.add_question(text, answer)

    dest = url_for("edit_questions", key=key)
    return redirect(dest)


@app.route("/edit/<key>/questions/update-text", methods=["POST"])
def _questions_update_text(key):
    number = request.form["number"]
    text = request.form["text"]

    quiz = Quiz.get(key)
    quiz.update_question_text(number, text)

    dest = url_for("edit_questions", key=key)
    return redirect(dest)


@app.route("/edit/<key>/questions/update-answer", methods=["POST"])
def post_questions_update_answer(key):
    number = request.form["number"]
    answer = request.form["answer"]

    quiz = Quiz.get(key)
    quiz.update_question_answer(number, answer)

    dest = url_for("edit_questions", key=key)
    return redirect(dest)


@app.route("/edit/<key>/questions/remove", methods=["POST"])
def post_questions_remove(key):
    number = request.form["number"]

    quiz = Quiz.get(key)
    quiz.remove_question(number)

    dest = url_for("edit_questions", key=key)
    return redirect(dest)
