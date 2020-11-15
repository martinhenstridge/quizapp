"use strict";


// Events
const EVENT_ASK      = 1;
const EVENT_FOCUSIN  = 2;
const EVENT_FOCUSOUT = 3;
const EVENT_CHANGE   = 4;
const EVENT_LOCK     = 5;
const EVENT_REVEAL   = 6;


function Quiz(selector) {
    this.latest = 0;
    this.node = document.querySelector(selector);
    this.questions = new Map();
    Object.seal(this);
};

Quiz.prototype.inject = function (evt) {
    console.debug(`event: ${JSON.stringify(evt)}`);

    if (typeof evt.question == "undefined") {
        throw "Malformed event";
    }

    let question;
    if (this.questions.has(evt.question)) {
        question = this.questions.get(evt.question);
    } else {
        question = new Question(this,
                                evt.question,
                                evt.data.kind,
                                evt.data.src,
                                evt.data.mime);
        this.questions.set(evt.question, question);
    }

    question.inject(evt);
    question.dom_update();
};

Quiz.prototype.push = function (evt) {
    const url = "events";
    const request = {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        mode: "same-origin",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(evt),
    };

    fetch(url, request).then(_status);
};

Quiz.prototype.poll = function () {
    const url = `events?since=${this.latest}`;
    const request = {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        mode: "same-origin",
    };

    fetch(url, request).then(_status).then(_json).then(evts => {
        for (let evt of evts) {
            this.inject(evt);
            this.latest = evt.seqnum;
        }
    });
}


function Question(quiz, number, kind, src, mime) {
    this.quiz = quiz;
    this.open = false;
    this.text = "";
    this.guess = "";
    this.answer = null;
    this.dom_insert(number, kind, src, mime);
    Object.seal(this);
}

Question.prototype.dom_insert = function (number, kind, src, mime) {
    const template = document.getElementById("template_question");
    const clone = template.content.firstElementChild.cloneNode(true);

    const node_number = clone.querySelector(".question_number");
    const node_text = clone.querySelector(".question_text");
    const node_asset = clone.querySelector(".question_asset");
    const node_guess = clone.querySelector(".question_guess");
    const node_answer = clone.querySelector(".question_answer");

    // Write the question number.
    node_number.innerText = `Q${number}`;

    // Insert the uploaded asset, if present.
    switch (kind) {
        case 1:
            const img = document.createElement("img");
            img.src = src;
            img.width = "200";
            node_asset.appendChild(img);
            break;
        case 2:
            const audio = document.createElement("audio");
            audio.src = src;
            audio.type = mime;
            audio.controls = true;
            node_asset.appendChild(audio);
            break;
        case 3:
            const video = document.createElement("video");
            video.src = src;
            video.type = mime;
            video.controls = true;
            node_asset.appendChild(video);
            break;
        default:
            break;
    }

    // Add event listeners - these all push events straight to the server, to be
    // injected into the quiz once they arrive via polling.
    node_guess.addEventListener("focusin", (e) => {
        this.quiz.push({
            "kind": EVENT_FOCUSIN,
            "question": number,
            "data": {},
        });
        e.stopPropagation()
    });
    node_guess.addEventListener("focusout", (e) => {
        this.quiz.push({
            "kind": EVENT_FOCUSOUT,
            "question": number,
            "data": {},
        });
        e.stopPropagation()
    });
    node_guess.addEventListener("change", (e) => {
        this.quiz.push({
            "kind": EVENT_CHANGE,
            "question": number,
            "data": {
                "guess": node_guess.value,
            },
        });
        e.stopPropagation()
    });
    
    // Store interesting child nodes for future reference.
    this.node_text = node_text;
    this.node_guess = node_guess;
    this.node_answer = node_answer;

    // Finally, add the new question element into the DOM.
    this.quiz.node.appendChild(clone);
}

Question.prototype.dom_update = function () {
    this.node_text.innerText = this.text;

    // Only update guess field if not currently in focus.
    if (this.node_guess !== document.activeElement) {
        this.node_guess.value = this.guess;
        this.node_guess.disabled = !this.open;
    }

    if (this.answer === null) {
        this.node_answer.hidden = true;
        this.node_answer.innerText = "";
    } else {
        this.node_answer.hidden = false;
        this.node_answer.innerText = this.answer;
    }
}

Question.prototype.inject = function (evt) {
    switch (evt.kind) {
        case EVENT_ASK:
            if (this.open) throw "Question already asked";
            this.open = true;
            this.text = evt.data.text;
            break;

        case EVENT_FOCUSIN:
            break;

        case EVENT_FOCUSOUT:
            break;

        case EVENT_CHANGE:
            if (!this.open) throw "Question is locked";
            this.guess = evt.data.guess;
            break;

        case EVENT_LOCK:
            if (!this.open) throw "Question already locked";
            this.open = false;
            break;

        case EVENT_REVEAL:
            if (this.open) throw "Revealing answer to open question";
            this.answer = evt.data.answer;
            break;

        default:
            throw "Unknown event type";
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


function main() {
    let quiz = new Quiz("div#quiz");
    setInterval(function () { quiz.poll(); }, 1000);
}

main();
