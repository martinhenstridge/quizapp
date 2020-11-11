from flask import jsonify, render_template, request, session
from ..quiz import Quiz
from .. import app


@app.route("/<quizid>/play/<team>/")
def play(quizid, team):
    quiz = Quiz.get(quizid)
    player = session.get("player")

    # Unidentified player, redirect to join page.
    if player is None:
        dest = url_for("join", quizid=quizid, team=team)
        return redirect(dest)

    return render_template("play.html", quizid=quizid, team=team, player=player)


@app.route("/<quizid>/play/<team>/events", methods=["GET", "POST"])
def events(quizid, team):
    quiz = Quiz.get(quizid)

    if request.method == "POST":
        data = request.json
        print(data)
        quiz.add_event(
            data["kind"],
            team,
            session["player"],
            data["question"],
            data["data"]
        )
        return ""
    else:
        since = request.args["since"]
        events = quiz.get_events_since(team, since)
        return jsonify(events)
