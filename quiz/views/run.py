from flask import redirect, render_template, request, url_for
from ..quiz import Quiz
from .. import app

# EVENT_ASK           = 1;
# EVENT_EDIT_START    = 2;
# EVENT_EDIT_COMPLETE = 3;
# EVENT_REMOTE_UPDATE = 4;
# EVENT_LOCK          = 5;
# EVENT_REVEAL        = 6;


@app.route("/run/<key>/")
def run(key):
    quiz = Quiz.get(key)
    return render_template("run.html", key=key, questions=quiz.questions)


@app.route("/run/<key>/ask", methods=["POST"])
def _run_ask(key):
    number = request.form["number"]

    quiz = Quiz.get(key)
    quiz.update_question_state(number, 1)
    text = quiz.get_question_text(number)
    quiz.post_event(0, {"text": text})

    dest = url_for("run", key=key)
    return redirect(dest)

@app.route("/run/<key>/lock", methods=["POST"])
def _run_lock(key):
    number = request.form["number"]

    quiz = Quiz.get(key)
    quiz.update_question_state(number, 2)
    quiz.post_event(0, {})

    dest = url_for("run", key=key)
    return redirect(dest)


@app.route("/run/<key>/reveal", methods=["POST"])
def _run_reveal(key):
    number = request.form["number"]

    quiz = Quiz.get(key)
    quiz.update_question_state(number, 3)
    answer = quiz.get_question_answer(number)
    quiz.post_event(0, {"answer": answer})

    dest = url_for("run", key=key)
    return redirect(dest)
