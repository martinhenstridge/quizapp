"use strict";

const LOG_EVENT_ACTIVE = 601;
const LOG_EVENT_IGNORE = 602;


function Quiz(questions_container, eventlog_container, interval) {
    this.questions_container = document.querySelector(questions_container);
    this.eventlog_container = document.querySelector(eventlog_container);

    this.interval = interval;
    this.latest = 0;

    this.questions = new Map();
    this.question_nodes = new Map();
    this.eventlog = [];
    this.logged = 0;

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

    for (let evt of evts) {
        //console.log(`event: ${JSON.stringify(evt)}`);
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
            //console.log(`Dropping event: ${exc}`);
        }
    }

    this.update_dom_questions();
    this.update_dom_eventlog();
};


Quiz.prototype.update_dom_questions = function () {
    let node;
    for (let [number, question] of this.questions) {
        if (this.question_nodes.has(number)) {
            node = this.question_nodes.get(number);
        } else {
            node = new QuestionNode(this, question);
            this.question_nodes.set(number, node);
        }

        const desired_state = QuestionNode.calculate_desired_state(question);
        const ops = node.calculate_update_ops(desired_state);
        for (let op of ops) {
            //console.log(`update [Q${number}]: ${JSON.stringify(op)}`);
            node.update(quiz, question, op.kind, op.data);
        }
        node.state = desired_state;
    }
};


Quiz.prototype.update_dom_eventlog = function () {
    let node;
    for (let i = this.logged; i < this.eventlog.length; i++) {
        node = new EventLogNode(this.eventlog[i][0], this.eventlog[i][1]);
        node.insert(this.eventlog_container);
        this.logged++;
    }
};


Quiz.prototype.handle_event = function (evt) {
    if (!Number.isInteger(evt.kind)) {
        throw "Missing or invalid event kind";
    }

    let log = null;
    switch (evt.kind) {
        // Incoming events.
        case EVENT_JOIN:
            log = this.handle_incoming_join(evt.data);
            break;
        case EVENT_ASK:
            log = this.handle_incoming_ask(evt.data);
            break;
        case EVENT_FOCUS:
            log = this.handle_incoming_focus(evt.data);
            break;
        case EVENT_BLUR:
            log = this.handle_incoming_blur(evt.data);
            break;
        case EVENT_GUESS:
            log = this.handle_incoming_guess(evt.data);
            break;
        case EVENT_LOCK:
            log = this.handle_incoming_lock(evt.data);
            break;
        case EVENT_REVEAL:
            log = this.handle_incoming_reveal(evt.data);
            break;

        // Local events.
        case EVENT_LOCAL_FOCUS:
            log = this.handle_local_focus(evt.data);
            break;
        case EVENT_LOCAL_BLUR:
            log = this.handle_local_blur(evt.data);
            break;
        case EVENT_LOCAL_EDIT:
            log = this.handle_local_edit(evt.data);
            break;
        case EVENT_LOCAL_DISCARD:
            log = this.handle_local_discard(evt.data);
            break;
        case EVENT_LOCAL_SUBMIT_SEND:
            log = this.handle_local_submit_send(evt.data);
            break;
        case EVENT_LOCAL_SUBMIT_SUCCESS:
            log = this.handle_local_submit_success(evt.data);
            break;
        case EVENT_LOCAL_SUBMIT_FAILURE:
            log = this.handle_local_submit_failure(evt.data);
            break;

        default:
            throw `Unknown event kind: ${evt.kind}`;
    }

    switch (log) {
        case LOG_EVENT_ACTIVE:
            this.eventlog.push([evt, true]);
            break;
        case LOG_EVENT_IGNORE:
            this.eventlog.push([evt, false]);
            break;
        default:
            break;
    }
};


Quiz.prototype.handle_incoming_join = function (data) {
    for (let question of this.questions.values()) {
        question.cursors.delete(data.player);
    }
    return LOG_EVENT_ACTIVE;
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
    return LOG_EVENT_ACTIVE;
};


Quiz.prototype.handle_incoming_focus = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    if (question.state === QUESTION_STATE_LOCKED) {
        return;
    }
    question.cursors.add(data.player);
};


Quiz.prototype.handle_incoming_blur = function (data) {
    if (!Number.isInteger(data.question)) {
        throw `Missing or invalid question number: ${data.question}`;
    }
    if (!this.questions.has(data.question)) {
        throw `Question not yet asked: ${data.question}`;
    }

    const question = this.questions.get(data.question);
    if (question.state === QUESTION_STATE_LOCKED) {
        return;
    }
    question.cursors.delete(data.player);
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
        return LOG_EVENT_IGNORE;
    }
    question.guess = data.guess;
    if (question.wip === data.guess) {
        question.wip = null;
    }
    return LOG_EVENT_ACTIVE;
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
    question.cursors.clear();
    question.wip = null;
    return LOG_EVENT_ACTIVE;
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
    return LOG_EVENT_ACTIVE;
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
