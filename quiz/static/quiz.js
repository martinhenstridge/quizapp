"use strict";


// Events
const EVENT_ASK      = 1;
const EVENT_FOCUSIN  = 2;
const EVENT_FOCUSOUT = 3;
const EVENT_CHANGE   = 4;
const EVENT_LOCK     = 5;
const EVENT_REVEAL   = 6;

// Media
const MEDIA_IMAGE = 1;
const MEDIA_AUDIO = 2;
const MEDIA_VIDEO = 3;


function Quiz(selector) {
    this.latest = 0;
    this.node = document.querySelector(selector);
    this.questions = new Map();
    Object.seal(this);
};

Quiz.prototype.inject_events = function (evts) {
    const prev = new Map(this.questions);
    for (let evt of evts) {
        try {
            this.inject(evt);
        } catch (exc) {
            console.log(`Dropping event: ${exc}`);
        }
    }
    const curr = this.questions;

    const ops = [];
    for (let [n, q] of curr) {
        if (!Object.is(q, prev.get(n))) {
            ops.push(n);
            // calculate required updates, append to 'ops' array
        }
    }
    return ops;
};

Quiz.prototype.inject = function (evt) {
    console.debug(`event: ${JSON.stringify(evt)}`);

    if (!Number.isInteger(evt.seqnum)) {
        throw "Missing or invalid sequence number";
    }
    this.latest = evt.seqnum;

    if (!Number.isInteger(evt.question)) {
        throw "Missing or invalid question number";
    }
    const question = this.questions.get(evt.question);

    const updated = this.update_question(question, evt);
    this.questions.set(evt.question, updated);
};

Quiz.prototype.update_question = function (question, evt) {
    if (!Number.isInteger(evt.kind)) {
        throw "Missing or invalid event kind";
    }
    if (question instanceof Question) {
        if (evt.kind === EVENT_ASK) {
            throw "Question already asked";
        }
    } else {
        if (evt.kind !== EVENT_ASK) {
            throw "Question not yet asked";
        }
    }

    switch (evt.kind) {
        case EVENT_ASK:
            return Question.create(
                evt.question,
                evt.data.kind,
                evt.data.text,
                evt.data.media,
            );

        case EVENT_FOCUSIN:
            if (!question.open) {
                throw "Question is locked";
            }
            if (question.focus) {
                throw "Question already in focus";
            }
            return question.update({"focus": true});

        case EVENT_FOCUSOUT:
            if (!question.open) {
                throw "Question is locked";
            }
            if (!question.focus) {
                throw "Question already out of focus";
            }
            return question.update({"focus": false});

        case EVENT_CHANGE:
            if (!question.open) {
                throw "Question is locked";
            }
            return question.update({"guess": evt.data.guess});

        case EVENT_LOCK:
            if (!question.open) {
                throw "Question already locked";
            }
            return question.update({"open": false, "focus": false});

        case EVENT_REVEAL:
            if (question.open) {
                throw "Revealing answer to open question";
            }
            return question.update({"answer": evt.data.answer});

        default:
            throw "Unknown event kind";
    }
}

//==============================================================================

function Question(number, kind, text, media, open, focus, guess, answer) {
    this.number = number;
    this.kind = kind;
    this.text = text;
    this.media = media;
    this.open = open;
    this.focus = focus;
    this.guess = guess;
    this.answer = answer;
}

Question.create = function (number, kind, text, media) {
    const created = new Question(number, kind, text, media, true, false, "", null);
    Object.freeze(created);
    return created;
};

Question.prototype.update = function (updates) {
    const copy = new Question(
        this.number,
        this.kind,
        this.text,
        this.media,
        this.open,
        this.focus,
        this.guess,
        this.answer,
    );
    Object.assign(copy, updates);
    Object.freeze(copy);
    return copy;
};

Question.prototype.toJSON = function () {
    return {
        "number": this.number,
        "kind": this.kind,
        "text": this.text,
        "media": this.media,
        "open": this.open,
        "focus": this.focus,
        "guess": this.guess,
        "answer": this.answer,
    };
};

//==============================================================================

function DomNode(quiz, number, kind, text, media) {
    const template = document.getElementById("__template");
    const node_question = template.content.firstElementChild.cloneNode(true);

    const node_number = node_question.querySelector(".__number");
    const node_text = node_question.querySelector(".__text");
    const node_media = node_question.querySelector(".__media");
    const node_guess = node_question.querySelector(".__guess");
    const node_answer = node_question.querySelector(".__answer");

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

    // Add event listeners - these all push events straight to the server, to be
    // injected into the quiz once they arrive via polling.
    node_guess.addEventListener("focusin", (e) => {
        quiz.push({
            "kind": EVENT_FOCUSIN,
            "question": number,
            "data": {},
        });
        e.stopPropagation()
    });
    node_guess.addEventListener("focusout", (e) => {
        quiz.push({
            "kind": EVENT_FOCUSOUT,
            "question": number,
            "data": {},
        });
        e.stopPropagation()
    });
    node_guess.addEventListener("change", (e) => {
        quiz.push({
            "kind": EVENT_CHANGE,
            "question": number,
            "data": {
                "guess": node_guess.value,
            },
        });
        e.stopPropagation()
    });

    // Store interesting children for future reference.
    this.question = node_question;
    this.guess = node_guess;
    this.answer = node_answer;
}

//==============================================================================

let quiz = new Quiz("#quiz");
let ops;

ops = quiz.inject_events([
    {
        "seqnum":1,"kind":1,"question":1,
        "data":{"kind":0,"text":"Text question","media":null},
    },
    {
        "seqnum":2,"kind":1,"question":2,
        "data":{"kind":1,"text":"Image question","media":{"src":"url","mime":"image/jpeg"}},
    },
    {
        "seqnum":3,"kind":1,"question":3,
        "data":{"kind":2,"text":"Audio question","media":{"src":"url","mime":"audio/mpeg"}},
    },
    {
        "seqnum":4,"kind":1,"question":4,
        "data":{"kind":3,"text":"Video question","media":{"src":"url","mime":"video/mpeg"}},
    },
]);
console.log(ops);

ops = quiz.inject_events([
    {
        "seqnum":5,"kind":2,"question":1,
        "data":{},
    },
    {
        "seqnum":6,"kind":4,"question":1,
        "data":{"guess":"bar"},
    },
    {
        "seqnum":7,"kind":2,"question":3,
        "data":{},
    },
    {
        "seqnum":8,"kind":3,"question":3,
        "data":{"guess":"bar"},
    },
    {
        "seqnum":9,"kind":5,"question":4,
        "data":{},
    },
    {
        "seqnum":10,"kind":6,"question":4,
        "data":{"answer":"stuff here"},
    },
    {
        "seqnum":11,"kind":6,"question":1,
        "data":{"answer":"stuff here"},
    },
]);
console.log(ops);

for (let [n, q] of quiz.questions) {
    console.log(`${n}: ${JSON.stringify(q, null, 4)}`);
}
