from flask import Flask, request
from . import api, views


def create_app():
    app = Flask(__name__)

    @app.route("/")
    def handler_home():
        return "Welcome!\n"

    @app.route("/create", methods=["GET", "POST"])
    def handler_create():
        if request.method == "GET":
            return views.create.page()
        if request.method == "POST":
            return views.create.post(request.form["inst"])

    @app.route("/edit/<inst>/")
    def handler_edit(inst):
        return views.edit.page(inst)

    @app.route("/edit/<inst>/players/")
    def handler_edit_players(inst):
        return views.edit.page_players(inst)

    @app.route("/edit/<inst>/players/add", methods=["POST"])
    def handler_edit_players_add(inst):
        return views.edit.post_players_add(inst, request.form["name"], request.form["team"])

    @app.route("/edit/<inst>/questions/")
    def handler_edit_questions(inst):
        return views.edit.page_questions(inst)

    @app.route("/play/<inst>/")
    def handler_play(inst):
        return views.play.page(inst)

    @app.route("/play/<inst>/<name>")
    def handler_play_player(inst, name):
        return views.play.page_player(inst, name)

    @app.route("/events/<inst>", methods=["POST"])
    def handler_api():
        return None

    return app
