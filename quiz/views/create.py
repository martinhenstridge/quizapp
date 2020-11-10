from flask import redirect, render_template, url_for
from .quiz import Quiz


def page():
    return render_template("create.html")


def post(inst):
    quiz = Quiz.new(inst)
    dest = url_for("handler_edit", inst=inst)
    return redirect(dest)
