"use strict";


// Incoming events from server
const EVENT_INCOMING_JOIN   = 101;
const EVENT_INCOMING_ASK    = 102;
const EVENT_INCOMING_FOCUS  = 103;
const EVENT_INCOMING_BLUR   = 104;
const EVENT_INCOMING_GUESS  = 105;
const EVENT_INCOMING_LOCK   = 106;
const EVENT_INCOMING_REVEAL = 107;

// Locally generated events
const EVENT_LOCAL_FOCUS          = 111;
const EVENT_LOCAL_BLUR           = 112;
const EVENT_LOCAL_EDIT           = 113;
const EVENT_LOCAL_DISCARD        = 114;
const EVENT_LOCAL_SUBMIT_SEND    = 115;
const EVENT_LOCAL_SUBMIT_SUCCESS = 116;
const EVENT_LOCAL_SUBMIT_FAILURE = 117;

// Guess input states
const STATE_OPEN = 101;
const STATE_EDITING = 102
const STATE_SYNCING = 103;
const STATE_LOCKED = 104;

// Media
const MEDIA_IMAGE = 1;
const MEDIA_AUDIO = 2;
const MEDIA_VIDEO = 3;


function Quiz(selector) {
    this.latest = 0;
    this.node = document.querySelector(selector);
    this.questions = new Map();
    this.domstate = new Map();
    Object.seal(this);
};


Quiz.prototype.update = function (evts) {
    for (let evt of evts) {
        try {
            this.inject(evt);
        } catch (exc) {
            console.log(`Dropping event: ${exc}`);
        }
    }

    for (let [n, q] of this.questions) {
        let olddom = this.domstate.get(n);
        let newdom = new DomState(q);
        let ops = newdom.calculate_updates(olddom);
        console.log(`Q${n} update operations:`);
        console.log(JSON.stringify(ops));
        this.domstate.set(n, newdom);
    }
};


Quiz.prototype.inject = function (evt) {
    console.debug(`event: ${JSON.stringify(evt)}`);

    if (!Number.isInteger(evt.kind)) {
        throw "Missing or invalid event kind";
    }

    switch (evt.kind) {
        // Incoming events.
        case EVENT_INCOMING_JOIN:
            this.handle_incoming_join(evt.data);
            break;
        case EVENT_INCOMING_ASK:
            this.handle_incoming_ask(evt.data);
            break;
        case EVENT_INCOMING_FOCUS:
            this.handle_incoming_focus(evt.data);
            break;
        case EVENT_INCOMING_BLUR:
            this.handle_incoming_blur(evt.data);
            break;
        case EVENT_INCOMING_GUESS:
            this.handle_incoming_guess(evt.data);
            break;
        case EVENT_INCOMING_LOCK:
            this.handle_incoming_lock(evt.data);
            break;
        case EVENT_INCOMING_REVEAL:
            this.handle_incoming_reveal(evt.data);
            break;

        // Local events.
        case EVENT_LOCAL_FOCUS:
            this.handle_local_focus(evt.data);
            break;
        case EVENT_LOCAL_BLUR:
            this.handle_local_blur(evt.data);
            break;
        case EVENT_LOCAL_EDIT:
            this.handle_local_edit(evt.data);
            break;
        case EVENT_LOCAL_DISCARD:
            this.handle_local_discard(evt.data);
            break;
        case EVENT_LOCAL_SUBMIT_SEND:
            this.handle_local_submit_send(evt.data);
            break;
        case EVENT_LOCAL_SUBMIT_SUCCESS:
            this.handle_local_submit_success(evt.data);
            break;
        case EVENT_LOCAL_SUBMIT_FAILURE:
            this.handle_local_submit_failure(evt.data);
            break;

        default:
            throw `Unknown event kind: ${evt.kind}`;
    }

    //if (!Number.isInteger(evt.seqnum)) {
    //    throw "Missing or invalid sequence number";
    //}
    //this.latest = evt.seqnum;
};


Quiz.prototype.handle_incoming_join = function (data) {
    throw "Not implemented";
};


Quiz.prototype.handle_incoming_ask = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (this.questions.has(data.question)) {
        throw `Question already asked: ${data.question}`;
    }

    const question = Question.create(
        data.question,
        data.kind,
        data.text,
        data.media,
    );
    this.questions.set(data.question, question);
};


Quiz.prototype.handle_incoming_focus = function (data) {
    throw "Not implemented";
};


Quiz.prototype.handle_incoming_blur = function (data) {
    throw "Not implemented";
};


Quiz.prototype.handle_incoming_guess = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    if (question.state === STATE_LOCKED) {
        throw "Question is locked";
    }

    question.guess = data.guess;
};


Quiz.prototype.handle_incoming_lock = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    if (question.state === STATE_LOCKED) {
        throw `Question already locked: ${data.question}`;
    }

    question.state = STATE_LOCKED;
    question.wip = question.guess;
};


Quiz.prototype.handle_incoming_reveal = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    if (question.state !== STATE_LOCKED) {
        throw `Question not yet locked: ${data.question}`;
    }

    question.answer = data.answer;
};


Quiz.prototype.handle_local_focus = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    switch (question.state) {
        case STATE_LOCKED:
            throw "Question is locked";
        case STATE_SYNCING:
            throw "Syncing in progress";
        case STATE_EDITING:
            throw "Already editing";
    }

    question.state = STATE_EDITING;
};


Quiz.prototype.handle_local_blur = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    switch (question.state) {
        case STATE_LOCKED:
            throw "Question is locked";
        case STATE_SYNCING:
            throw "Syncing in progress";
        case STATE_OPEN:
            throw "Not editing";
    }

    question.state = STATE_OPEN;
};


Quiz.prototype.handle_local_edit = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    switch (question.state) {
        case STATE_LOCKED:
            throw "Question is locked";
        case STATE_SYNCING:
            throw "Syncing in progress";
        case STATE_OPEN:
            throw "Not editing";
    }

    question.wip = data.guess;
};


Quiz.prototype.handle_local_discard = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    switch (question.state) {
        case STATE_LOCKED:
            throw "Question is locked";
        case STATE_SYNCING:
            throw "Syncing in progress";
        case STATE_EDIT:
            throw "Editing in progress";
    }

    question.wip = question.guess;
};


Quiz.prototype.handle_local_submit_send = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    switch (question.state) {
        case STATE_LOCKED:
            throw "Question is locked";
        case STATE_SYNCING:
            throw "Syncing in progress";
    }

    question.state = STATE_SYNCING;
};


Quiz.prototype.handle_local_submit_success = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    if (question.state !== STATE_SYNCING) {
        throw "Not syncing";
    }

    question.state = STATE_OPEN;
};


Quiz.prototype.handle_local_submit_failure = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    if (question.state !== STATE_SYNCING) {
        throw "Not syncing";
    }

    question.state = STATE_OPEN;
};

//==============================================================================

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
    return new Question(number, kind, text, media, STATE_OPEN, "", "", null);
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
