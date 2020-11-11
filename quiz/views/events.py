from flask import jsonify, request
from ..quiz import Quiz
from .. import app


@app.route("/events/<key>/", methods=["GET", "POST"])
def events(key):
    quiz = Quiz.get(key)

    if request.method == "POST":
        print(request.json)
        #quiz.post_event(request.form)

    team = request.args.get("team", None)
    since = request.args.get("since", 0)

    events = quiz.get_events_since(team, since)
    return jsonify(events)
