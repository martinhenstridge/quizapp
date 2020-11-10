from flask import redirect, render_template, url_for
from ..quiz import Quiz


def page():
    return render_template("new.html")


def post(form):
    key = form["key"]
    quiz = Quiz.new(key)
    dest = url_for("handler_edit", key=key)
    return redirect(dest)
