"use strict";


function Quiz(selector, interval) {
    this.node = document.querySelector(selector);
    this.interval = interval;
    this.questions = new Map();
    this.domnodes = new Map();
    this.latest = 0;
    Object.seal(this);
};


Quiz.prototype.poll = function () {
    poll(this.latest).then(evts => {
        this.inject_events(evts, false);
        setTimeout(this.poll.bind(this), this.interval);
    });
};


Quiz.prototype.inject_events = function (evts, local) {
    if (evts.length === 0) {
        return;
    }
    const start = new Date();

    for (let evt of evts) {
        console.log(`event: ${JSON.stringify(evt)}`);
        try {
            if (!local) {
                const seqnum = evt.seqnum;
                if (!Number.isInteger(seqnum)) {
                    throw "Missing or invalid sequence number";
                }
                this.latest = seqnum;
            }
            this.handle_event(evt);
        } catch (exc) {
            console.log(`Dropping event: ${exc}`);
        }
    }

    const finish_int = new Date();
    this.update_dom();

    const finish_ext = new Date();
    console.log(`duration: ${finish_int - start}ms + ${finish_ext - finish_int}ms`)
};


Quiz.prototype.update_dom = function () {
    let domnode;
    for (let [number, question] of this.questions) {
        if (this.domnodes.has(number)) {
            domnode = this.domnodes.get(number);
        } else {
            domnode = new DomNode(this, question);
            this.domnodes.set(number, domnode);
        }

        const desired_state = DomNode.calculate_desired_state(question);
        const ops = domnode.calculate_update_ops(desired_state);
        for (let op of ops) {
            console.log(`update [Q${number}]: ${JSON.stringify(op)}`);
            domnode.update(quiz, question, op.kind, op.data);
        }
        domnode.state = desired_state;
    }
};


Quiz.prototype.handle_event = function (evt) {
    if (!Number.isInteger(evt.kind)) {
        throw "Missing or invalid event kind";
    }

    switch (evt.kind) {
        // Incoming events.
        case EVENT_JOIN:
            this.handle_incoming_join(evt.data);
            break;
        case EVENT_ASK:
            this.handle_incoming_ask(evt.data);
            break;
        case EVENT_FOCUS:
            this.handle_incoming_focus(evt.data);
            break;
        case EVENT_BLUR:
            this.handle_incoming_blur(evt.data);
            break;
        case EVENT_GUESS:
            this.handle_incoming_guess(evt.data);
            break;
        case EVENT_LOCK:
            this.handle_incoming_lock(evt.data);
            break;
        case EVENT_REVEAL:
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
    if (question.state === QUESTION_STATE_LOCKED) {
        throw "Question is locked";
    }

    question.guess = data.guess;
    if (question.wip === data.guess) {
        question.wip = null;
    }
};


Quiz.prototype.handle_incoming_lock = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    if (question.state === QUESTION_STATE_LOCKED) {
        throw `Question already locked: ${data.question}`;
    }

    question.state = QUESTION_STATE_LOCKED;
    question.wip = null;
};


Quiz.prototype.handle_incoming_reveal = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    if (question.state !== QUESTION_STATE_LOCKED) {
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
        case QUESTION_STATE_LOCKED:
            throw "Question is locked";
        case QUESTION_STATE_SYNCING:
            throw "Syncing in progress";
        case QUESTION_STATE_EDITING:
            throw "Already editing";
    }

    question.state = QUESTION_STATE_EDITING;
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
        case QUESTION_STATE_LOCKED:
            throw "Question is locked";
        case QUESTION_STATE_SYNCING:
            throw "Syncing in progress";
        case QUESTION_STATE_OPEN:
            throw "Not editing";
    }

    question.state = QUESTION_STATE_OPEN;
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
        case QUESTION_STATE_LOCKED:
            throw "Question is locked";
        case QUESTION_STATE_SYNCING:
            throw "Syncing in progress";
        case QUESTION_STATE_OPEN:
            throw "Not editing";
    }

    if (data.guess === question.guess) {
        question.wip = null;
    } else {
        question.wip = data.guess;
    }
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
        case QUESTION_STATE_LOCKED:
            throw "Question is locked";
        case QUESTION_STATE_SYNCING:
            throw "Syncing in progress";
        case QUESTION_STATE_EDITING:
            throw "Editing in progress";
    }

    question.wip = null;
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
        case QUESTION_STATE_LOCKED:
            throw "Question is locked";
        case QUESTION_STATE_SYNCING:
            throw "Syncing in progress";
    }

    question.state = QUESTION_STATE_SYNCING;
};


Quiz.prototype.handle_local_submit_success = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    if (question.state !== QUESTION_STATE_SYNCING) {
        throw "Not syncing";
    }

    question.state = QUESTION_STATE_OPEN;
};


Quiz.prototype.handle_local_submit_failure = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    if (question.state !== QUESTION_STATE_SYNCING) {
        throw "Not syncing";
    }

    question.state = QUESTION_STATE_OPEN;
};
