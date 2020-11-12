from flask import render_template
from ... import app


@app.route("/<quizid>/admin/")
def admin(quizid):
    return render_template("admin/index.html", quizid=quizid)
