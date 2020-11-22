from flask import redirect, render_template, request, url_for
from ...quiz import Quiz
from ...event import EventKind
from ...question import QuestionKind, QuestionState
from ... import app


ADMIN_TEAM = 0
ADMIN_PLAYER = "__QUIZMASTER__"


@app.route("/<quizid>/admin/run/")
def run(quizid):
    quiz = Quiz.get(quizid)
    return render_template("admin/run.html", quizid=quizid, questions=quiz.questions)


@app.route("/<quizid>/admin/run/ask", methods=["POST"])
def run_ask(quizid):
    quiz = Quiz.get(quizid)
    number = int(request.form["number"])

    quiz.update_question_state(number, QuestionState.ASKED)

    question = quiz.get_question(number)
    if question.kind is QuestionKind.TEXT:
        media = None
    else:
        media = {
            "src": url_for("assets", quizid=quizid, filename=question.filename),
            "mime": question.mimetype,
        }

    quiz.add_event(
        EventKind.ASK,
        {
            "question": number,
            "kind": question.kind.value,
            "text": question.text,
            "media": media,
        },
        ADMIN_TEAM,
        ADMIN_PLAYER,
    )

    dest = url_for("run", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/run/lock", methods=["POST"])
def run_lock(quizid):
    quiz = Quiz.get(quizid)
    number = int(request.form["number"])

    quiz.update_question_state(number, QuestionState.LOCKED)

    quiz.add_event(EventKind.LOCK, {"question": number}, ADMIN_TEAM, ADMIN_PLAYER)

    dest = url_for("run", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/run/reveal", methods=["POST"])
def run_reveal(quizid):
    quiz = Quiz.get(quizid)
    number = int(request.form["number"])

    quiz.update_question_state(number, QuestionState.REVEALED)

    question = quiz.get_question(number)
    quiz.add_event(
        EventKind.REVEAL,
        {"question": number, "answer": question.answer},
        ADMIN_TEAM,
        ADMIN_PLAYER,
    )

    dest = url_for("run", quizid=quizid)
    return redirect(dest)
