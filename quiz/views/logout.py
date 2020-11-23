from flask import render_template, session
from .. import app


@app.route("/logout")
def logout():
    session.clear()
    return render_template("logout.html")
