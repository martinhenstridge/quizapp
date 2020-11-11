"use strict";


// States
const STATE_OPEN   = 1;
const STATE_FLUX   = 2;
const STATE_LOCKED = 3;

// Events
const EVENT_ASK           = 1;
const EVENT_EDIT_START    = 2;
const EVENT_EDIT_COMPLETE = 3;
const EVENT_REMOTE_UPDATE = 4;
const EVENT_LOCK          = 5;
const EVENT_REVEAL        = 6;

function str_state(state) {
    switch (state) {
        case STATE_OPEN:
            return "OPEN";
        case STATE_FLUX:
            return "FLUX";
        case STATE_LOCKED:
            return "LOCKED";
        default:
            return "?";
    }
}

function str_event(evt) {
    switch (evt) {
        case EVENT_ASK:
            return "ASK";
        case EVENT_EDIT_START:
            return "EDIT_START";
        case EVENT_EDIT_COMPLETE:
            return "EDIT_COMPLETE";
        case EVENT_REMOTE_UPDATE:
             return "REMOTE_UPDATE";
        case EVENT_LOCK:
            return "LOCK";
        case EVENT_REVEAL:
            return "REVEAL";
        default:
            return "?";
    }
}


function Quiz(selector) {
    this.node = document.querySelector(selector);
    this.questions = new Map();
    Object.freeze(this);
};

Quiz.prototype.post = function (evt) {
    console.debug(`event: ${JSON.stringify(evt)}`);

    let question;
    if (this.questions.has(evt.question)) {
        question = this.questions.get(evt.question);
    } else {
        question = new Question(this, evt.question);
        this.questions.set(evt.question, question);
    }
    console.log(`${question}`);

    question.post(evt);
    question.update_dom();
};

Quiz.prototype.push_update = function (evt) {
    console.log("Pushing update to server")

    const url = "";
    const request = {
        method: "POST",
        cache: "no-store",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "same-origin",
        mode: "same-origin",
        body: JSON.stringify(evt),
    };

    fetch(url, request).then(_status).then(_json).then(evts => {
        for (let evt of evts) {
            console.log(JSON.stringify(evt));
            this.post(evt);
        }
    });
};

Quiz.prototype.pull_updates = function () {
    console.log("Pulling updates from server")

    const url = `events?since=${LATEST}`;
    const request = {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        mode: "same-origin",
    };

    fetch(url, request).then(_status).then(_json).then(evts => {
        for (let evt of evts) {
            this.post(evt);
        }
    });
}


function Question(quiz, number) {
    this.quiz = quiz;
    this.number = number;
    this.state = STATE_LOCKED;
    this.text = "";
    this.guess = "";
    this.answer = null;
    this.node = new_node(quiz, number);
    quiz.node.appendChild(this.node);
    Object.seal(this);
}

Question.prototype.toString = function () {
    return `Q${this.number}(${str_state(this.state)},${this.text},${this.guess},${this.answer})`;
};

Question.prototype.post = function (evt) {
    switch (evt.type) {
        case EVENT_ASK:
            console.log("hopefully here...")
            post_event_ask(this, evt.data);
            break;

        case EVENT_EDIT_START:
            post_event_edit_start(this, evt.data);
            break;

        case EVENT_EDIT_COMPLETE:
            post_event_edit_complete(this, evt.data);
            break;

        case EVENT_REMOTE_UPDATE:
            post_event_remote_update(this, evt.data);
            break;

        case EVENT_LOCK:
            post_event_lock(this, evt.data);
            break;

        case EVENT_REVEAL:
            post_event_reveal(this, evt.data);
            break;

        default:
            throw `Unknown event type: ${evt.type}`;
    }
}

Question.prototype.update_dom = function () {
    const text = this.node.querySelector(".question_text");
    const guess = this.node.querySelector(".question_guess");
    const answer = this.node.querySelector(".question_answer");

    text.innerText = this.text;

    if (this.state !== STATE_FLUX) {
        guess.value = this.guess;
        guess.disabled = (this.state === STATE_LOCKED);
    }

    if (this.answer === null) {
        answer.hidden = true;
        answer.innerText = "";
    } else {
        answer.hidden = false;
        answer.innerText = this.answer;
    }
}


function new_node(quiz, number) {
    const template = document.getElementById("template_question");
    const clone = template.content.firstElementChild.cloneNode(true);
    const input = clone.querySelector("input");

    input.addEventListener("focusin", function (e) {
        quiz.post({
            number: number,
            type: EVENT_EDIT_START,
        });
        e.stopPropagation()
    });
    input.addEventListener("focusout", function (e) {
        quiz.post({
            number: number,
            type: EVENT_EDIT_COMPLETE,
            guess: input.value,
        });
        e.stopPropagation()
    });

    return clone;
}


function post_event_ask(question, data) {
    question.state = STATE_OPEN;
    question.text = data.text;
}


function post_event_edit_start(question, data) {
    switch (question.state) {
        case STATE_OPEN:
            question.state = STATE_FLUX;
            break;

        case STATE_FLUX:
            throw "Edit already in progress";

        case STATE_LOCKED:
            throw "Question locked";

        default:
            throw `Unknown state: ${question.state}`;
    }
}


function post_event_edit_complete(question, data) {
    switch (question.state) {
        case STATE_FLUX:
            question.state = STATE_OPEN;
            question.guess = data.guess;
            break;

        case STATE_OPEN:
            throw "No edit in progress";

        case STATE_LOCKED:
            throw "Question is locked";

        default:
            throw `Unknown state: ${question.state}`;
    }
}


function post_event_remote_update(question, data) {
    switch (question.state) {
        case STATE_OPEN:
            question.guess = data.guess;
            break;

        case STATE_FLUX:
            console.debug("Local edit in progress, ignoring");
            break;

        case STATE_LOCKED:
            throw "Question is locked";

        default:
            throw `Unknown state: ${question.state}`;
    }
}


function post_event_lock(question, data) {
    switch (question.state) {
        case STATE_OPEN:
        case STATE_FLUX:
            question.state = STATE_LOCKED;
            break;

        case STATE_LOCKED:
            throw "Duplicate lock";

        default:
            throw `Unknown state: ${question.state}`;
    }
}


function post_event_reveal(question, data) {
    switch (question.state) {
        case STATE_LOCKED:
            question.answer = data.answer;
            break;

        case STATE_OPEN:
        case STATE_FLUX:
            throw "Revealing answer to open question";

        default:
            throw `Unknown state: ${question.state}`;
    }
}


function _status(msg) {
    if (msg.status >= 200 && msg.status < 300) {
        return Promise.resolve(msg);
    } else {
        console.log(msg);
        return Promise.reject(new Error(msg.statusText));
    }
}


function _json(msg) {
    return msg.json()
}


function process_incoming_events(quiz, evts) {
    for (let evt of evts) {
        quiz.post(evt);
    }
}

let LATEST = 0;
function main() {
    let quiz = new Quiz("div#quiz");
    setInterval(function () { quiz.pull_updates(); }, 1000);
}

main();
