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

Quiz.prototype.update = function (evt) {
    console.debug(`event: ${JSON.stringify(evt)}`);

    const question = this.questions.get(evt.number);
    const updated = update_question(this, evt.number, question, evt);
    this.questions.set(evt.number, updated);

    updated.set_node();
    if (typeof question === "undefined") {
        this.node.appendChild(updated.node);
    }
};


function Question(quiz, number, state, text, guess, answer, node) {
    this.quiz = quiz;
    this.number = number;
    this.state = state;
    this.text = text;
    this.guess = guess;
    this.answer = answer;
    this.node = (typeof node === "undefined") ? new_node(quiz, number) : node;
    Object.freeze(this);
}

Question.prototype.toString = function () {
    return `Question(${this.state}, ${this.text}, ${this.guess}, ${this.answer})`;
};

Question.prototype.set_state = function (state) {
    return new Question(
        this.quiz, this.number, state, this.text, this.guess, this.answer, this.node,
    );
};

Question.prototype.set_text = function (text) {
    return new Question(
        this.quiz, this.number, this.state, text, this.guess, this.answer, this.node,
    );
};

Question.prototype.set_guess = function (guess) {
    return new Question(
        this.quiz, this.number, this.state, this.text, guess, this.answer, this.node,
    );
};

Question.prototype.set_answer = function (answer) {
    return new Question(
        this.quiz, this.number, this.state, this.text, this.guess, answer, this.node,
    );
};

Question.prototype.set_node = function () {
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
        quiz.update({
            number: number,
            type: EVENT_EDIT_START,
        });
        e.stopPropagation()
    });
    node_guess.addEventListener("focusout", function (e) {
        quiz.update({
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


function update_question(quiz, number, question, data) {
    switch (data.type) {
        case EVENT_ASK:
            return post_event_ask(quiz, number, question, data);

        case EVENT_EDIT_START:
            return post_event_edit_start(question, data);

        case EVENT_EDIT_COMPLETE:
            return post_event_edit_complete(question, data);

        case EVENT_REMOTE_UPDATE:
            return post_event_remote_update(question, data);

        case EVENT_LOCK:
            return post_event_lock(question, data);

        case EVENT_REVEAL:
            return post_event_reveal(question, data);

        default:
            throw `Unknown event type: ${data.type}`;
    }
}


function post_event_ask(quiz, number, question, data) {
    if (typeof question !== "undefined") {
        throw "Duplicate question";
    }

    return new Question(quiz, number, STATE_OPEN, data.text, null, null);
}


function post_event_edit_start(question, data) {
    if (typeof question === "undefined") {
        throw "Non-existent question";
    }

    switch (question.state) {
        case STATE_OPEN:
            return question.set_state(STATE_FLUX);

        case STATE_FLUX:
            throw "Edit already in progress";

        case STATE_LOCKED:
            throw "Question locked";

        default:
            throw `Unknown state: ${question.state}`;
    }
}


function post_event_edit_complete(question, data) {
    if (typeof question === "undefined") {
        throw "Non-existent question";
    }

    switch (question.state) {
        case STATE_FLUX:
            return question.set_state(STATE_OPEN).set_guess(data.guess);

        case STATE_OPEN:
            throw "No edit in progress";

        case STATE_LOCKED:
            throw "Question is locked";

        default:
            throw `Unknown state: ${question.state}`;

    }
}


function post_event_remote_update(question, data) {
    if (typeof question === "undefined") {
        throw "Non-existent question";
    }

    switch (question.state) {
        case STATE_OPEN:
            return question.set_guess(data.guess);

        case STATE_FLUX:
            console.debug("Local edit in progress, ignoring");
            return question;

        case STATE_LOCKED:
            throw "Question is locked";

        default:
            throw `Unknown state: ${question.state}`;
    }
}


function post_event_lock(question, data) {
    if (typeof question === "undefined") {
        throw "Non-existent question";
    }

    switch (question.state) {
        case STATE_OPEN:
        case STATE_FLUX:
            return question.set_state(STATE_LOCKED);

        case STATE_LOCKED:
            throw "Duplicate lock";

        default:
            throw `Unknown state: ${question.state}`;
    }
}


function post_event_reveal(question, data) {
    if (typeof question === "undefined") {
        throw "Non-existent question";
    }

    switch (question.state) {
        case STATE_LOCKED:
            return question.set_answer(data.answer);

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
    { number: 3, type: EVENT_ASK, text: "What is 3+3?" },
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
            quiz.update(events[i]);
        } catch (err) {
            console.error(err);
        }
    }, i * 1000);
}
