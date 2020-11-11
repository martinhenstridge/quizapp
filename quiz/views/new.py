from flask import redirect, render_template, request, url_for
from ..quiz import Quiz
from .. import app


@app.route("/new", methods=["GET", "POST"])
def new():
    if request.method == "GET":
        return render_template("new.html")

    quizid = request.form["quizid"]
    quiz = Quiz.new(quizid)

    dest = url_for("admin", quizid=quizid)
    return redirect(dest)
