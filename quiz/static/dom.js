"use strict";

const INSERT_NEW = "insert";
const GUESS_SAVED = "guess-saved";
const GUESS_DISABLED = "guess-disabled";
const GUESS_TEXT = "guess-text";
const SUBMIT_DISABLED = "submit-disabled";
const SUBMIT_RUNNING = "submit-running";
const DISCARD_DISABLED = "discard-disabled";
const ANSWER_VISIBLE = "answer-visible";
const ANSWER_TEXT = "answer-text";


function DomState(question) {
    this[GUESS_SAVED] = question.wip === question.guess;

    if (question.answer === null) {
        this[ANSWER_VISIBLE] = false;
        this[ANSWER_TEXT] = "";
    } else {
        this[ANSWER_VISIBLE] = true;
        this[ANSWER_TEXT] = question.answer;
    }

    switch (question.state) {
        case STATE_OPEN:
            this[GUESS_DISABLED]   = false;
            this[GUESS_TEXT]       = question.wip;
            this[SUBMIT_DISABLED]  = false;
            this[SUBMIT_RUNNING]   = false;
            this[DISCARD_DISABLED] = false;
            break;

        case STATE_EDITING:
            this[GUESS_DISABLED]   = false;
            this[GUESS_TEXT]       = null;
            this[SUBMIT_DISABLED]  = false;
            this[SUBMIT_RUNNING]   = false;
            this[DISCARD_DISABLED] = false;
            break;

        case STATE_SYNCING:
            this[GUESS_DISABLED]   = true;
            this[GUESS_TEXT]       = null;
            this[SUBMIT_DISABLED]  = true;
            this[SUBMIT_RUNNING]   = true;
            this[DISCARD_DISABLED] = true;
            break;

        case STATE_LOCKED:
            this[GUESS_DISABLED]   = true;
            this[GUESS_TEXT]       = question.guess;
            this[SUBMIT_DISABLED]  = true;
            this[SUBMIT_RUNNING]   = false;
            this[DISCARD_DISABLED] = true;
            break;
    }
};

DomState.prototype.calculate_updates = function (prev) {
    if (!(prev instanceof DomState)) {
        return [{
            "kind": INSERT_NEW,
            "data": null,
        }];
    }

    let ops = [];

    for (let [key, val] of Object.entries(this)) {
        if (key === GUESS_TEXT && val === null) {
            // Never update the guess text while editing is in progress.
            continue;
        }
        if (val !== prev[key]) {
            ops.push({
                "kind": key,
                "data": val,
            });
        }
    }

    return ops;
};

//==============================================================================

function DomNode(quiz, number, kind, text, media) {
    const template = document.getElementById("__template");
    const node = template.content.firstElementChild.cloneNode(true);

    const node_number = node.querySelector(".__number");
    const node_text = node.querySelector(".__text");
    const node_media = node.querySelector(".__media");
    const node_guess = node.querySelector(".__guess");
    const node_commit = node.querySelector(".__commit");
    const node_discard = node.querySelector(".__discard");
    const node_answer = node.querySelector(".__answer");

    // Write the question number and text - these are static over the lifetime
    // of the question.
    node_number.innerText = `Q${number}`;
    node_text.innerText = text;

    // Insert any associated media.
    switch (kind) {
        case MEDIA_IMAGE:
            const image = document.createElement("img");
            image.src = media.src;
            image.width = "200";
            node_media.appendChild(image);
            break;
        case MEDIA_AUDIO:
            const audio = document.createElement("audio");
            audio.src = media.src;
            audio.type = media.mime;
            audio.controls = true;
            node_media.appendChild(audio);
            break;
        case MEDIA_VIDEO:
            const video = document.createElement("video");
            video.src = media.src;
            video.type = media.mime;
            video.width = "200";
            video.controls = true;
            node_media.appendChild(video);
            break;
        default:
            break;
    }

    node_guess.addEventListener("focus", (e) => {
        quiz.push({
            "kind": EVENT_LOCAL_FOCUS,
            "data": {
                "question": number,
            },
        });
        e.stopPropagation();
    });

    node_guess.addEventListener("blur", (e) => {
        quiz.push({
            "kind": EVENT_LOCAL_BLUR,
            "data": {
                "question": number,
            },
        });
        e.stopPropagation();
    });

    node_guess.addEventListener("input", (e) => {
        quiz.inject({
            "kind": EVENT_LOCAL_EDIT,
            "question": number,
            "data": {
                "guess": e.target.value,
            },
        });
        e.stopPropagation();
    });

    node_discard.addEventListener("click", (e) => {
        quiz.inject({
            "kind": EVENT_LOCAL_DISCARD,
            "data": {
                "question": number,
            },
        });
        e.stopPropagation();
    });

    node_commit.addEventListener("click", (e) => {
        quiz.inject({
            "kind": EVENT_LOCAL_SUBMIT_SEND,
            "data": {
                "question": number,
                "guess": e.target.value,
            },
        });
        e.stopPropagation();
    });

    node_commit.addEventListener("click", (e) => {
        quiz.inject({
            "kind": EVENT_LOCAL_SUBMIT_SUCCESS,
            "data": {
                "question": number,
            },
        });
        e.stopPropagation();
    });

    node_commit.addEventListener("click", (e) => {
        quiz.inject({
            "kind": EVENT_LOCAL_SUBMIT_FAILURE,
            "data": {
                "question": number,
            },
        });
        e.stopPropagation();
    });

    // Store interesting children for future reference.
    this.node = node;
    this.node_guess = node_guess;
    this.node_commit = node_commit;
    this.node_discard = node_discard;
    this.node_answer = node_answer;
}
