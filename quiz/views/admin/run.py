from flask import redirect, render_template, request, url_for
from ...quiz import Quiz
from ... import app

# EVENT_ASK           = 1;
# EVENT_EDIT_START    = 2;
# EVENT_EDIT_COMPLETE = 3;
# EVENT_REMOTE_UPDATE = 4;
# EVENT_LOCK          = 5;
# EVENT_REVEAL        = 6;


@app.route("/<quizid>/admin/run/")
def run(quizid):
    quiz = Quiz.get(quizid)
    return render_template(
        "admin/run.html",
        quizid=quizid,
        questions=quiz.questions,
        url_ask=url_for("run_ask", quizid=quizid),
        url_lock=url_for("run_lock", quizid=quizid),
        url_reveal=url_for("run_reveal", quizid=quizid),
    )


@app.route("/<quizid>/admin/run/ask", methods=["POST"])
def run_ask(quizid):
    number = request.form["number"]

    quiz = Quiz.get(quizid)
    quiz.update_question_state(number, 1)
    text = quiz.get_question_text(number)
    quiz.post_event(0, "_", 1, number, {"text": text})

    dest = url_for("run", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/run/lock", methods=["POST"])
def run_lock(quizid):
    number = request.form["number"]

    quiz = Quiz.get(quizid)
    quiz.update_question_state(number, 2)
    quiz.post_event(0, "_", 5, number, {})

    dest = url_for("run", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/run/reveal", methods=["POST"])
def run_reveal(quizid):
    number = request.form["number"]

    quiz = Quiz.get(quizid)
    quiz.update_question_state(number, 3)
    answer = quiz.get_question_answer(number)
    quiz.post_event(0, "_", 6, number, {"answer": answer})

    dest = url_for("run", quizid=quizid)
    return redirect(dest)
