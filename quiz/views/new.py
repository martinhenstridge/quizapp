from flask import redirect, render_template, request, url_for
from ..quiz import Quiz
from .. import app


@app.route("/new", methods=["GET", "POST"])
def new():
    if request.method == "GET":
        return render_template("new.html")

    key = request.form["key"]
    quiz = Quiz.new(key)
    dest = url_for("edit", key=key)
    return redirect(dest)
