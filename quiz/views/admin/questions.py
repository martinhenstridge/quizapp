from flask import redirect, render_template, request, url_for
from ...quiz import Quiz
from ... import app


@app.route("/<quizid>/admin/questions/")
def edit_questions(quizid):
    quiz = Quiz.get(quizid)
    return render_template("admin/questions.html", questions=quiz.questions)


@app.route("/<quizid>/admin/questions/add", methods=["POST"])
def _questions_add(quizid):
    text = request.form["text"]
    answer = request.form["answer"]

    quiz = Quiz.get(quizid)
    quiz.add_question(text, answer)

    dest = url_for("edit_questions", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/questions/update-text", methods=["POST"])
def _questions_update_text(quizid):
    number = request.form["number"]
    text = request.form["text"]

    quiz = Quiz.get(quizid)
    quiz.update_question_text(number, text)

    dest = url_for("edit_questions", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/questions/update-answer", methods=["POST"])
def _questions_update_answer(quizid):
    number = request.form["number"]
    answer = request.form["answer"]

    quiz = Quiz.get(quizid)
    quiz.update_question_answer(number, answer)

    dest = url_for("edit_questions", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/questions/remove", methods=["POST"])
def _questions_remove(quizid):
    number = request.form["number"]

    quiz = Quiz.get(quizid)
    quiz.remove_question(number)

    dest = url_for("edit_questions", quizid=quizid)
    return redirect(dest)
