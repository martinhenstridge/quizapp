from flask import redirect, render_template, request, url_for
from ...quiz import Quiz
from ... import app


# EVENT_ASK      = 1;
# EVENT_FOCUSIN  = 2;
# EVENT_FOCUSOUT = 3;
# EVENT_GUESS    = 4;
# EVENT_LOCK     = 5;
# EVENT_REVEAL   = 6;


@app.route("/<quizid>/admin/run/")
def run(quizid):
    quiz = Quiz.get(quizid)
    return render_template("admin/run.html", quizid=quizid, questions=quiz.questions)


@app.route("/<quizid>/admin/run/ask", methods=["POST"])
def run_ask(quizid):
    quiz = Quiz.get(quizid)
    number = request.form["number"]

    quiz.update_question_state(number, 1)

    question = quiz.get_question(number)
    if question.kind == 0:
        src = None
    else:
        src = url_for("assets", quizid=quizid, filename=question.filename)
    quiz.add_event(
        1,
        0,
        "_",
        number,
        {
            "kind": question.kind,
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

    quiz.update_question_state(number, 2)

    quiz.add_event(5, 0, "_", number, {})

    dest = url_for("run", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/run/reveal", methods=["POST"])
def run_reveal(quizid):
    quiz = Quiz.get(quizid)
    number = request.form["number"]

    quiz.update_question_state(number, 3)

    question = quiz.get_question(number)
    quiz.add_event(6, 0, "_", number, {"answer": question.answer})

    dest = url_for("run", quizid=quizid)
    return redirect(dest)
