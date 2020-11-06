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


function Quiz(selector) {
    this.node = document.querySelector(selector);
    this.questions = new Map();
    Object.freeze(this);
};

Quiz.prototype.post = function (evt) {
    console.debug(`event: ${JSON.stringify(evt)}`);

    let question;
    if (this.questions.has(evt.number)) {
        question = this.questions.get(evt.number);
    } else {
        question = new Question(this, evt.number);
        this.questions.set(evt.number, question);
    }

    question.post(evt);
    question.update_dom();
};


function Question(quiz, number) {
    this.quiz = quiz;
    this.number = number;
    this.state = STATE_LOCKED;
    this.text = "";
    this.guess = null;
    this.answer = null;
    this.node = new_node(quiz, number);
    quiz.node.appendChild(this.node);
}

Question.prototype.toString = function () {
    return `Question(${this.state}, ${this.text}, ${this.guess}, ${this.answer})`;
};

Question.prototype.post = function (data) {
    switch (data.type) {
        case EVENT_ASK:
            post_event_ask(this, data);
            break;

        case EVENT_EDIT_START:
            post_event_edit_start(this, data);
            break;

        case EVENT_EDIT_COMPLETE:
            post_event_edit_complete(this, data);
            break;

        case EVENT_REMOTE_UPDATE:
            post_event_remote_update(this, data);
            break;

        case EVENT_LOCK:
            post_event_lock(this, data);
            break;

        case EVENT_REVEAL:
            post_event_reveal(this, data);
            break;

        default:
            throw `Unknown event type: ${data.type}`;
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


function h(tag, props, children) {
    let elem = document.createElement(tag);
    for (let [k, v] of Object.entries(props)) {
        elem[k] = v;
    }
    for (let child of children) {
        elem.appendChild(child)
    }
    return elem;
}


function new_node(quiz, number) {
    const node_number = h("span", {
        className: "question_number",
        innerText: `[Q${number}] `
    }, []);
    const node_text = h("span", {
        className: "question_text"
    }, []);
    const node_guess = h("input", {
        className: "question_guess"
    }, []);
    const node_answer = h("p", {
        className: "question_answer"
    }, []);

    node_guess.addEventListener("focusin", function (e) {
        quiz.post({
            number: number,
            type: EVENT_EDIT_START,
        });
        e.stopPropagation()
    });
    node_guess.addEventListener("focusout", function (e) {
        quiz.post({
            number: number,
            type: EVENT_EDIT_COMPLETE,
            guess: e.target.value,
        });
        e.stopPropagation()
    });

    return h("div", { className: "question" }, [
        h("div", {}, [node_number, node_text]),
        h("div", {}, [node_guess]),
        h("div", {}, [node_answer]),
    ]);
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


let events = [
    { number: 1, type: EVENT_ASK, text: "What is 1+1?" },
    { number: 2, type: EVENT_ASK, text: "What is 2+2?" },
    { number: 1, type: EVENT_REMOTE_UPDATE, guess: "1" },
    { number: 1, type: EVENT_REMOTE_UPDATE, guess: "2" },
    { number: 3, type: EVENT_ASK, text: "What is 3+3?" },
    { number: 3, type: EVENT_REMOTE_UPDATE, guess: "6" },
    { number: 4, type: EVENT_ASK, text: "What is 4+4?" },
    { number: 5, type: EVENT_ASK, text: "What is 5+5?" },
    { number: 1, type: EVENT_LOCK },
    { number: 2, type: EVENT_LOCK },
    { number: 3, type: EVENT_LOCK },
    { number: 4, type: EVENT_LOCK },
    { number: 5, type: EVENT_LOCK },
    { number: 1, type: EVENT_REVEAL, answer: "2" },
    { number: 2, type: EVENT_REVEAL, answer: "4" },
    { number: 3, type: EVENT_REVEAL, answer: "6" },
    { number: 4, type: EVENT_REVEAL, answer: "8" },
    { number: 5, type: EVENT_REVEAL, answer: "10" },
]

let quiz = new Quiz("div#quiz");
for (let i = 0; i < events.length; i++) {
    setTimeout(() => {
        try {
            quiz.post(events[i]);
        } catch (err) {
            console.error(err);
        }
    }, i * 1000);
}
