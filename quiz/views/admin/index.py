from flask import render_template, url_for
from ... import app


@app.route("/<quizid>/admin/")
def admin(quizid):
    return render_template(
        "admin/index.html",
        quizid=quizid,
        url_edit_teams=url_for("edit_teams", quizid=quizid),
        url_edit_questions=url_for("edit_questions", quizid=quizid),
        url_run_quiz=url_for("run", quizid=quizid),
    )
