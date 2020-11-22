from flask import jsonify, redirect, render_template, request, session, url_for
from ..event import EventKind
from ..quiz import Quiz
from .. import app


@app.route("/<quizid>/play/")
def play(quizid):
    quiz = Quiz.get(quizid)

    team = session.get("team")
    player = session.get("player")

    # Unidentified player, redirect to join page.
    if player is None or team is None:
        dest = url_for("join", quizid=quizid)
        return redirect(dest)

    return render_template("play.html", quizid=quizid, team=team, player=player)


@app.route("/<quizid>/play/events", methods=["GET", "POST"])
def events(quizid):
    quiz = Quiz.get(quizid)

    if request.method == "POST":
        data = request.json
        quiz.add_event(
            EventKind(data["kind"]),
            data["data"],
            session["team"],
            session["player"],
        )
        import time
        time.sleep(0.5)
        print(data)
        return "{}"

    team = session["team"]
    since = request.args["since"]

    events = quiz.get_events_since(team, since)
    return jsonify(events)
