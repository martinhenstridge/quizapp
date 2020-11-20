"use strict";


const DOM_INSERT = "insert";
const DOM_GUESS_SAVED = "guess-saved";
const DOM_GUESS_DISABLED = "guess-disabled";
const DOM_GUESS_TEXT = "guess-text";
const DOM_SUBMIT_DISABLED = "submit-disabled";
const DOM_SUBMIT_RUNNING = "submit-running";
const DOM_DISCARD_DISABLED = "discard-disabled";
const DOM_ANSWER_HIDDEN = "answer-hidden";
const DOM_ANSWER_TEXT = "answer-text";


function DomProxy(question) {
    this[DOM_GUESS_SAVED] = question.wip === question.guess;

    if (question.answer === null) {
        this[DOM_ANSWER_HIDDEN] = true;
        this[DOM_ANSWER_TEXT] = "";
    } else {
        this[DOM_ANSWER_HIDDEN] = false;
        this[DOM_ANSWER_TEXT] = question.answer;
    }

    switch (question.state) {
        case STATE_OPEN:
            this[DOM_GUESS_DISABLED]   = false;
            this[DOM_GUESS_TEXT]       = null;
            this[DOM_SUBMIT_DISABLED]  = false;
            this[DOM_SUBMIT_RUNNING]   = false;
            this[DOM_DISCARD_DISABLED] = false;
            break;

        case STATE_EDITING:
            this[DOM_GUESS_DISABLED]   = false;
            this[DOM_GUESS_TEXT]       = null;
            this[DOM_SUBMIT_DISABLED]  = false;
            this[DOM_SUBMIT_RUNNING]   = false;
            this[DOM_DISCARD_DISABLED] = false;
            break;

        case STATE_SYNCING:
            this[DOM_GUESS_DISABLED]   = true;
            this[DOM_GUESS_TEXT]       = question.wip;
            this[DOM_SUBMIT_DISABLED]  = true;
            this[DOM_SUBMIT_RUNNING]   = true;
            this[DOM_DISCARD_DISABLED] = true;
            break;

        case STATE_LOCKED:
            this[DOM_GUESS_DISABLED]   = true;
            this[DOM_GUESS_TEXT]       = question.guess;
            this[DOM_SUBMIT_DISABLED]  = true;
            this[DOM_SUBMIT_RUNNING]   = false;
            this[DOM_DISCARD_DISABLED] = true;
            break;
    }

    return this;
}


DomProxy.prototype.calculate_updates = function (prev) {
    if (prev === null) {
        return [{ "kind": DOM_INSERT, "data": null }];
    }

    let ops = [];
    for (let [key, val] of Object.entries(this)) {
        if (key === DOM_GUESS_TEXT && val === null) {
            // Never update the guess text while editing is in progress.
            continue;
        }
        if (val !== prev[key]) {
            ops.push({ "kind": key, "data": val });
        }
    }
    return ops;
};

//==============================================================================

function DomNode(quiz, question) {
    const template = document.getElementById("__template");
    const node = template.content.firstElementChild.cloneNode(true);

    const node_number = node.querySelector(".__number");
    const node_text = node.querySelector(".__text");
    const node_media = node.querySelector(".__media");
    const node_guess = node.querySelector(".__guess");
    const node_submit = node.querySelector(".__submit");
    const node_discard = node.querySelector(".__discard");
    const node_answer = node.querySelector(".__answer");

    // Write the question number and text - these are static over the lifetime
    // of the question.
    node_number.innerText = `Q${question.number}`;
    node_text.innerText = question.text;

    // Insert any associated media.
    switch (question.kind) {
        case MEDIA_IMAGE:
            const image = document.createElement("img");
            image.src = question.media.src;
            image.width = "200";
            node_media.appendChild(image);
            break;

        case MEDIA_AUDIO:
            const audio = document.createElement("audio");
            audio.src = question.media.src;
            audio.type = question.media.mime;
            audio.controls = true;
            node_media.appendChild(audio);
            break;

        case MEDIA_VIDEO:
            const video = document.createElement("video");
            video.src = question.media.src;
            video.type = question.media.mime;
            video.width = "200";
            video.controls = true;
            node_media.appendChild(video);
            break;

        default:
            break;
    }

    node_guess.addEventListener("focus", (e) => {
        quiz.update([{
            "kind": EVENT_LOCAL_FOCUS,
            "data": {
                "question": question.number,
            },
        }]);
        e.stopPropagation();
    });

    node_guess.addEventListener("blur", (e) => {
        quiz.update([{
            "kind": EVENT_LOCAL_BLUR,
            "data": {
                "question": question.number,
            },
        }]);
        e.stopPropagation();
    });

    node_guess.addEventListener("input", (e) => {
        alert(`${JSON.stringify(question)}`);
        quiz.update([{
            "kind": EVENT_LOCAL_EDIT,
            "question": question.number,
            "data": {
                "guess": e.target.value,
            },
        }]);
        e.stopPropagation();
    });

    node_discard.addEventListener("click", (e) => {
        quiz.update([{
            "kind": EVENT_LOCAL_DISCARD,
            "data": {
                "question": question.number,
            },
        }]);
        e.stopPropagation();
    });

    node_submit.addEventListener("click", (e) => {
        quiz.update([{
            "kind": EVENT_LOCAL_SUBMIT_SEND,
            "data": {
                "question": question.number,
                "guess": e.target.value,
            },
        }]);
        e.stopPropagation();
    });

    this.node = node;
    this.node_guess = node_guess;
    this.node_submit = node_submit;
    this.node_discard = node_discard;
    this.node_answer = node_answer;
    this.domproxy = null;
}


DomNode.prototype.update = function (quiz, question, opkind, opdata) {
    switch (opkind) {
        case DOM_INSERT:
            quiz.node.appendChild(this.node);
            break;

        case DOM_GUESS_SAVED:
            this.node_guess.style.backgroundColor = opdata ? "white" : "yellow";
            break;

        case DOM_GUESS_DISABLED:
            this.node_guess.disabled = opdata;
            break;

        case DOM_GUESS_TEXT:
            this.node_guess.value = opdata;
            break;

        case DOM_SUBMIT_DISABLED:
            this.node_submit.disabled = opdata;
            break;

        case DOM_SUBMIT_RUNNING:
            this.node_submit.innerText = opdata ? "..." : "Submit";
            break;

        case DOM_DISCARD_DISABLED:
            this.node_discard.disabled = opdata;
            break;

        case DOM_ANSWER_HIDDEN:
            this.node_answer.hidden = opdata;
            break;

        case DOM_ANSWER_TEXT:
            this.node_answer.innerText = opdata;
            break;

        default:
            throw "Unknown update operation";
    }
};
