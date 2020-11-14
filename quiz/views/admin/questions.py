import os
import hashlib
from typing import Tuple, Optional
from flask import redirect, render_template, request, url_for
from werkzeug.datastructures import FileStorage
from ...quiz import Quiz
from ... import app


def calculate_checksum(fs: FileStorage) -> str:
    checksum = hashlib.md5()

    # Process in chunks to avoid reading the whole file into memory at once.
    while True:
        data = fs.read(1024)
        if not data:
            break
        checksum.update(data)

    # Rewind the file before returning.
    fs.seek(0)
    return checksum.hexdigest()


def process_upload(
    quiz: Quiz, fs: Optional[FileStorage]
) -> Tuple[Optional[str], Optional[str]]:
    # No uploaded file, no need for filename or mimetype values.
    if fs is None:
        return None, None

    filename = calculate_checksum(fs)
    with open(os.path.join(quiz.assets, filename), "wb") as fd:
        fs.save(fd)
    return filename, fs.mimetype


@app.route("/<quizid>/admin/questions/")
def edit_questions(quizid):
    quiz = Quiz.get(quizid)
    return render_template(
        "admin/questions.html", quizid=quizid, questions=quiz.questions
    )


@app.route("/<quizid>/admin/questions/add", methods=["POST"])
def _questions_add(quizid):
    quiz = Quiz.get(quizid)

    kind = request.form["kind"]
    text = request.form["text"]
    answer = request.form["answer"]

    # @@@ check that file not uploaded for text questions.
    fs = request.files["file"]
    if fs.filename != "":
        filename, mimetype = process_upload(quiz, fs)
    else:
        filename = None
        mimetype = None

    quiz.add_question(kind, text, answer, filename, mimetype)

    dest = url_for("edit_questions", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/questions/update-text", methods=["POST"])
def _questions_update_text(quizid):
    number = request.form["number"]
    text = request.form["text"]

    quiz = Quiz.get(quizid)
    quiz.update_question_text(number, text)

    dest = url_for("edit_questions", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/questions/update-answer", methods=["POST"])
def _questions_update_answer(quizid):
    number = request.form["number"]
    answer = request.form["answer"]

    quiz = Quiz.get(quizid)
    quiz.update_question_answer(number, answer)

    dest = url_for("edit_questions", quizid=quizid)
    return redirect(dest)


@app.route("/<quizid>/admin/questions/remove", methods=["POST"])
def _questions_remove(quizid):
    number = request.form["number"]

    quiz = Quiz.get(quizid)
    quiz.remove_question(number)

    dest = url_for("edit_questions", quizid=quizid)
    return redirect(dest)
