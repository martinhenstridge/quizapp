from flask import jsonify, redirect, render_template, request, session, url_for
from ..event import EventKind
from ..quiz import Quiz
from .. import app


@app.route("/<quizid>/play/")
def play(quizid):
    quiz = Quiz.get(quizid)

    session_quizid = session.get("quizid")
    session_team = session.get("team")
    session_player = session.get("player")

    # Invalid or missing cookie. Redirect to 'join' page.
    if session_quizid != quizid or session_team is None or session_player is None:
        dest = url_for("join", quizid=quizid)
        return redirect(dest)

    quiz.add_event(
        EventKind.JOIN,
        {},
        session_team,
        session_player,
    )
    return render_template(
        "play.html", quizid=quizid, team=session_team, player=session_player
    )


@app.route("/<quizid>/play/events", methods=["GET", "POST"])
def events(quizid):
    quiz = Quiz.get(quizid)

    session_quizid = session.get("quizid")
    session_team = session.get("team")
    session_player = session.get("player")

    # Invalid or missing cookie. Return 401 - Unauthorized.
    if session_quizid != quizid or session_team is None or session_player is None:
        return jsonify("Session credentials do not match current quiz"), 401

    if request.method == "POST":
        data = request.json
        quiz.add_event(
            EventKind(data["kind"]),
            data["data"],
            session_team,
            session_player,
        )
        return jsonify({})

    since = request.args["since"]
    events = quiz.get_events_since(session_team, since)
    return jsonify(events)
