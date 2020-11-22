"use strict";

function Question(number, kind, text, media, state, guess, wip, answer) {
    this.number = number;
    this.kind = kind;
    this.text = text;
    this.media = media;
    this.state = state;
    this.guess = guess;
    this.wip = wip;
    this.answer = answer;
    Object.seal(this);
}

Question.create = function (number, kind, text, media) {
    return new Question(
        number,
        kind,
        text,
        media,
        QUESTION_STATE_OPEN,
        "",
        null,
        null,
    );
};

Question.prototype.toJSON = function () {
    return {
        "number": this.number,
        "kind": this.kind,
        "text": this.text,
        "media": this.media,
        "state": this.state,
        "guess": this.guess,
        "wip": this.wip,
        "answer": this.answer,
    };
};
