from flask import redirect, render_template, request, url_for
from ...quiz import Quiz
from ...question import QuestionKind, QuestionState
from ... import app


@app.route("/<quizid>/admin/run/")
def run(quizid):
    quiz = Quiz.get(quizid)
    return render_template("admin/run.html", quizid=quizid, questions=quiz.questions)


@app.route("/<quizid>/admin/run/ask", methods=["POST"])
def run_ask(quizid):
    quiz = Quiz.get(quizid)
    number = request.form["number"]

    quiz.update_question_state(number, QuestionState.ASKED)

    question = quiz.get_question(number)
    if question.kind is not QuestionKind.TEXT:
        src = url_for("assets", quizid=quizid, filename=question.filename)
    else:
        src = None

    quiz.add_event(
        number,
        EventKind.ASK,
        {
            "kind": question.kind.value,
            "text": question.text,
            "src": src,
        },
    )

    dest = url_for("run", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/run/lock", methods=["POST"])
def run_lock(quizid):
    quiz = Quiz.get(quizid)
    number = request.form["number"]

    quiz.update_question_state(number, QuestionState.LOCKED)

    quiz.add_event(number, EventKind.LOCK, {})

    dest = url_for("run", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/run/reveal", methods=["POST"])
def run_reveal(quizid):
    quiz = Quiz.get(quizid)
    number = request.form["number"]

    quiz.update_question_state(number, QuestionState.REVEALED)

    question = quiz.get_question(number)
    quiz.add_event(number, EventKind.REVEAL, {"answer": question.answer})

    dest = url_for("run", quizid=quizid)
    return redirect(dest)
