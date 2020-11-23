"use strict";

const DOM_INSERTED         = 401;
const DOM_GUESS_SAVED      = 402;
const DOM_GUESS_DISABLED   = 403;
const DOM_GUESS_TEXT       = 404;
const DOM_SUBMIT_DISABLED  = 405;
const DOM_SUBMIT_RUNNING   = 406;
const DOM_DISCARD_DISABLED = 407;
const DOM_CURSORS_TEXT     = 408;
const DOM_ANSWER_HIDDEN    = 409;
const DOM_ANSWER_TEXT      = 410;


function DomNode(quiz, question) {
    // Clone question template from HTML.
    const template = document.getElementById("__template");
    const node = template.content.firstElementChild.cloneNode(true);

    // Lookup interesting children.
    const node_number = node.querySelector(".__number");
    const node_text = node.querySelector(".__text");
    const node_media = node.querySelector(".__media");
    const node_guess = node.querySelector(".__guess");
    const node_saved = node.querySelector(".__saved");
    const node_submit = node.querySelector(".__submit");
    const node_discard = node.querySelector(".__discard");
    const node_cursors = node.querySelector(".__cursors");
    const node_answer = node.querySelector(".__answer");

    // Write the question number, question text and insert any associated media
    // - these are static over the lifetime of the question.
    node_number.innerText = `Q${question.number}`;
    node_text.innerText = question.text;
    switch (question.kind) {
        case QUESTION_KIND_TEXT:
            break;
        case QUESTION_KIND_IMAGE:
            _insert_image(node_media, media);
            break;
        case QUESTION_KIND_AUDIO:
            _insert_audio(node_media, media);
            break;
        case QUESTION_KIND_VIDEO:
            _insert_video(node_media, media);
            break;
    }

    // Add event listeners.
    node_guess.addEventListener("focus", _handler_guess_focus(quiz, question));
    node_guess.addEventListener("blur", _handler_guess_blur(quiz, question));
    node_guess.addEventListener("input", _handler_guess_input(quiz, question));
    node_guess.addEventListener("keyup", _handler_guess_enter(quiz, question));
    node_submit.addEventListener("click", _handler_submit_click(quiz, question));
    node_discard.addEventListener("click", _handler_discard_click(quiz, question));

    this.node = node;
    this.node_guess = node_guess;
    this.node_saved = node_saved;
    this.node_submit = node_submit;
    this.node_discard = node_discard;
    this.node_cursors = node_cursors;
    this.node_answer = node_answer;
    this.state = DomNode.calculate_desired_state(question, true);
}


DomNode.calculate_desired_state = function (question, newnode) {
    const proxy = new Map();

    if (newnode) {
        return proxy;
    }

    proxy.set(DOM_INSERTED, true);
    proxy.set(DOM_CURSORS_TEXT, Array.from(question.cursors).sort().join(" | "));

    if (question.wip === null) {
        proxy.set(DOM_GUESS_SAVED, true);
        proxy.set(DOM_GUESS_TEXT, question.guess);
    } else {
        proxy.set(DOM_GUESS_SAVED, false);
        proxy.set(DOM_GUESS_TEXT, question.wip);
    }

    if (question.answer === null) {
        proxy.set(DOM_ANSWER_HIDDEN, true);
        proxy.set(DOM_ANSWER_TEXT, "");
    } else {
        proxy.set(DOM_ANSWER_HIDDEN, false);
        proxy.set(DOM_ANSWER_TEXT, question.answer);
    }

    switch (question.state) {
        case QUESTION_STATE_OPEN:
            proxy.set(DOM_GUESS_DISABLED, false);
            proxy.set(DOM_SUBMIT_DISABLED, false);
            proxy.set(DOM_SUBMIT_RUNNING, false);
            proxy.set(DOM_DISCARD_DISABLED, false);
            break;

        case QUESTION_STATE_EDITING:
            proxy.set(DOM_GUESS_DISABLED, false);
            proxy.set(DOM_SUBMIT_DISABLED, false);
            proxy.set(DOM_SUBMIT_RUNNING, false);
            proxy.set(DOM_DISCARD_DISABLED, false);
            break;

        case QUESTION_STATE_SYNCING:
            proxy.set(DOM_GUESS_DISABLED, true);
            proxy.set(DOM_SUBMIT_DISABLED, true);
            proxy.set(DOM_SUBMIT_RUNNING, true);
            proxy.set(DOM_DISCARD_DISABLED, true);
            break;

        case QUESTION_STATE_LOCKED:
            proxy.set(DOM_GUESS_DISABLED, true);
            proxy.set(DOM_SUBMIT_DISABLED, true);
            proxy.set(DOM_SUBMIT_RUNNING, false);
            proxy.set(DOM_DISCARD_DISABLED, true);
            break;
    }

    return proxy;
}


DomNode.prototype.calculate_update_ops = function (desired) {
    let ops = [];
    for (let [key, val] of desired) {
        //@@@ ideally avoid any DOM update while in EDITING state
        //    no harm in current implementation, just wasteful
        if (val !== this.state.get(key)) {
            ops.push({ "kind": key, "data": val });
        }
    }
    return ops;
};


DomNode.prototype.update = function (quiz, question, opkind, opdata) {
    switch (opkind) {
        case DOM_INSERTED:
            if (opdata) {
                quiz.node.appendChild(this.node);
            } else {
                // Impossible
            }
            break;

        case DOM_GUESS_SAVED:
            if (opdata) {
                this.node_saved.classList.remove("edited");
            } else {
                this.node_saved.classList.add("edited");
            }
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

        case DOM_CURSORS_TEXT:
            this.node_cursors.innerText = opdata;
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


function _insert_image(container, media) {
    const image = document.createElement("img");
    image.src = media.src;
    image.width = "200";
    container.appendChild(image);
}


function _insert_audio(container, media) {
    const audio = document.createElement("audio");
    audio.src = media.src;
    audio.type = media.mime;
    audio.controls = true;
    container.appendChild(audio);
}


function _insert_video(container, media) {
    const video = document.createElement("video");
    video.src = media.src;
    video.type = media.mime;
    video.width = "200";
    video.controls = true;
    container.appendChild(video);
}


function _handler_guess_focus(quiz, question) {
    return function (e) {
        const data = {
            "question": question.number,
        };

        push({
            "kind": EVENT_FOCUS,
            "data": data,
        });

        quiz.inject_events([{
            "kind": EVENT_LOCAL_FOCUS,
            "data": data,
        }], true);

        e.stopPropagation();
    };
}


function _handler_guess_blur(quiz, question) {
    return function (e) {
        const data = {
            "question": question.number,
        };

        push({
            "kind": EVENT_BLUR,
            "data": data,
        });

        quiz.inject_events([{
            "kind": EVENT_LOCAL_BLUR,
            "data": data,
        }], true);

        e.stopPropagation();
    };
}


function _handler_guess_input(quiz, question) {
    return function (e) {
        const data = {
            "question": question.number,
            "guess": e.target.value,
        };

        quiz.inject_events([{
            "kind": EVENT_LOCAL_EDIT,
            "data": data,
        }], true);

        e.stopPropagation();
    };
}


function _handler_guess_enter(quiz, question) {
    return function (e) {
        if (e.key === "Enter") {
            e.target.blur();
            _submit_guess(quiz, question);
            e.stopPropagation();
        }
    };
}


function _handler_submit_click(quiz, question) {
    return function (e) {
        _submit_guess(quiz, question);
        e.stopPropagation();
    };
}


function _handler_discard_click(quiz, question) {
    return function (e) {
        const data = {
            "question": question.number,
        };

        quiz.inject_events([{
            "kind": EVENT_LOCAL_DISCARD,
            "data": data,
        }], true);

        e.stopPropagation();
    };
}


function _submit_guess(quiz, question) {
    const data = {
        "question": question.number,
        "guess": question.wip !== null ? question.wip : question.guess,
    };

    const _success_fn = quiz.inject_events.bind(
        quiz,
        [{
            "kind": EVENT_LOCAL_SUBMIT_SUCCESS,
            "data": data,
        }],
        true,
    );
    const _failure_fn = quiz.inject_events.bind(
        quiz,
        [{
            "kind": EVENT_LOCAL_SUBMIT_FAILURE,
            "data": data,
        }],
        true,
    );

    push({
        "kind": EVENT_GUESS,
        "data": data,
    }).then(_success_fn, _failure_fn)

    quiz.inject_events([{
        "kind": EVENT_LOCAL_SUBMIT_SEND,
        "data": data,
    }], true);
}
