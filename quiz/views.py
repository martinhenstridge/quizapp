from flask import redirect, render_template, url_for
from .quiz import Quiz


def page_new():
    return render_template("new.html")


def post_new(inst):
    quiz = Quiz.new(inst)
    dest = url_for("handler_quiz_edit", inst=inst)
    return redirect(dest)

def edit(quiz):
    return f"[{quiz.inst}] EDIT PAGE..."


def home(quiz):
    return f"[{quiz.inst}] HOME PAGE..."


def play(quiz, player):
    return f"[{quiz.inst}:{player}] PLAY PAGE..."
