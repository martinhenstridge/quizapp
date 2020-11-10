from flask import Flask, request
from . import api, views


def create_app():
    app = Flask(__name__)

    @app.route("/")
    def handler_home():
        return "Welcome!\n"

    @app.route("/new", methods=["GET", "POST"])
    def handler_new():
        if request.method == "GET":
            return views.new.page()
        if request.method == "POST":
            return views.new.post(request.form)


    @app.route("/edit/<key>/")
    def handler_edit(key):
        return views.edit.page(key)


    @app.route("/edit/<key>/players/")
    def handler_edit_players(key):
        return views.edit.page_players(key)

    @app.route("/edit/<key>/players/add", methods=["POST"])
    def handler_edit_players_add(key):
        return views.edit.post_players_add(key, request.form)

    @app.route("/edit/<key>/players/update", methods=["POST"])
    def handler_edit_players_update(key):
        return views.edit.post_players_update(key, request.form)

    @app.route("/edit/<key>/players/remove", methods=["POST"])
    def handler_edit_players_remove(key):
        return views.edit.post_players_remove(key, request.form)


    @app.route("/edit/<key>/questions/")
    def handler_edit_questions(key):
        return views.edit.page_questions(key)

    @app.route("/edit/<key>/questions/add", methods=["POST"])
    def handler_edit_questions_add(key):
        return views.edit.post_questions_add(key, request.form)

    @app.route("/edit/<key>/questions/update-text", methods=["POST"])
    def handler_edit_questions_update_text(key):
        return views.edit.post_questions_update_text(key, request.form)

    @app.route("/edit/<key>/questions/update-answer", methods=["POST"])
    def handler_edit_questions_update_answer(key):
        return views.edit.post_questions_update_answer(key, request.form)

    @app.route("/edit/<key>/questions/remove", methods=["POST"])
    def handler_edit_questions_remove(key):
        return views.edit.post_questions_remove(key, request.form)


    @app.route("/play/<key>/")
    def handler_play(key):
        return views.play.page(key)

    @app.route("/play/<key>/<name>")
    def handler_play_player(key, name):
        return views.play.page_player(key, name)

    @app.route("/events/<key>", methods=["POST"])
    def handler_api():
        return None

    return app
