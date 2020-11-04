
// States
const STATE_OPEN   = 1;
const STATE_FLUX   = 2;
const STATE_LOCKED = 3;

// Events
const EVENT_ASK           = 1
const EVENT_EDIT_START    = 2;
const EVENT_EDIT_COMPLETE = 3;
const EVENT_REMOTE_UPDATE = 4;
const EVENT_LOCK          = 5;
const EVENT_REVEAL        = 6;


let Question = Immutable.Record({
    state: null,
    text: "",
    guess: "",
    answer: "",
});

let QuestionDom = Immutable.Record({
    locked: true,
    text: "",
    guess: "",
    answer: "",
});


function calculate_dom_state(question) {
    if (typeof question === "undefined") {
        return undefined;
    }
    return QuestionDom({
        locked: question.state === STATE_LOCKED,
        text: question.text,
        guess: question.guess,
        answer: question.answer,
    });
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

function append_dom(root, number, dom) {
    root.appendChild(
        h("div", {
            id: `Q${number}`,
            className: "question",
        }, [
            h("div", {}, [
                h("span", {
                    innerText: `[Q${number}] `,
                }, []),
                h("span", {
                    id: `Q${number}__text`,
                    innerText: dom.text,
                }, []),
            ]),
            h("div", {}, [
                h("input", {
                    id: `Q${number}__guess`,
                    value: dom.guess,
                    disabled: dom.locked,
                }, []),
            ]),
            h("div", {}, [
                h("p", {
                    id: `Q${number}__answer`,
                    innerText: dom.answer,
                }, []),
            ]),
        ]),
    );
}

function append_dom_old(root, number, dom) {
    let container = document.createElement("div");
    container.className = "question";
    container.id = `Q${number}`;

    let qcontainer = document.createElement("div");
    let gcontainer = document.createElement("div");
    let acontainer = document.createElement("div");

    let node_number = document.createElement("span");
    node_number.innerText = `[Q${number}] `;

    let node_text = document.createElement("span");
    node_text.id = `Q${number}__text`;
    node_text.innerText = dom.text;

    let node_guess = document.createElement("input");
    node_guess.id = `Q${number}__guess`;
    node_guess.value = dom.guess;
    node_guess.disabled = dom.locked;

    let node_answer = document.createElement("p");
    node_answer.id = `Q${number}__answer`;
    node_answer.innerText = dom.answer;

    qcontainer.appendChild(node_number);
    qcontainer.appendChild(node_text);
    gcontainer.appendChild(node_guess);
    acontainer.appendChild(node_answer);

    container.appendChild(qcontainer);
    container.appendChild(gcontainer);
    container.appendChild(acontainer);

    root.appendChild(container);
}


function edit_dom(elem, number, wanted) {
    let text = elem.querySelector(`#Q${number}__text`);
    let guess = elem.querySelector(`#Q${number}__guess`);
    let answer = elem.querySelector(`#Q${number}__answer`);

    text.innerText = wanted.text;
    guess.value = wanted.guess;
    guess.disabled = wanted.locked;
    answer.innerText = wanted.answer;
}


function update_dom(number, wanted) {
    const root = document.querySelector("div#quiz");
    const elem = root.querySelector(`div#Q${number}`);

    if (elem === null) {
        append_dom(root, number, wanted);
    } else {
        edit_dom(elem, number, wanted);
    }
}


function update_quiz(quiz, data) {
    const q_old = quiz.get(data.number);
    const q_new = update_question(q_old, data);

    const dom_old = calculate_dom_state(q_old);
    const dom_new = calculate_dom_state(q_new);

    if (!Immutable.is(dom_new, dom_old)) {
        update_dom(data.number, dom_new, dom_old);
    }

    return quiz.set(data.number, q_new);
}


function update_question(question, data) {
    switch (data.type) {
        case EVENT_ASK:
            return post_event_ask(question, data);

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


function post_event_ask(question, data) {
    if (typeof question !== "undefined") {
        throw "Duplicate question";
    }

    return Question({ state: STATE_OPEN, text: data.text });
}


function post_event_edit_start(question, data) {
    if (typeof question === "undefined") {
        throw "Non-existent question";
    }

    switch (question.state) {
        case STATE_OPEN:
            return question.set("state", STATE_FLUX);

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
            return question.set("state", STATE_OPEN).set("guess", data.guess);

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
            return question.set("guess", data.guess);

        case STATE_FLUX:
            console.log("Local edit in progress, ignoring");
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
            return question.set("state", STATE_LOCKED);

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
            return question.set("answer", data.answer);

        case STATE_OPEN:
        case STATE_FLUX:
            throw "Revealing answer to open question";

        default:
            throw `Unknown state: ${question.state}`;
    }
}


function handle_focusin(quiz, e) {
    const target = e.target;
    if (target.tagName !== "INPUT") {
        return;
    }

    const number = target.parentNode.parentNode.id;
    // post_event(EVENT_EDIT_START, {number: number});

    e.stopPropagation()
}


function handle_focusout(quiz, e) {
    const target = e.target;
    if (target.tagName !== "INPUT") {
        return;
    }

    const number = target.parentNode.parentNode.id;
    // post_event(EVENT_EDIT_COMPLETE, {number: number, guess: target.value});

    e.stopPropagation()
}


function main() {
    const area = document.querySelector("div.quiz");
    area.addEventListener("focusin", handle_focusin);
    area.addEventListener("focusout", handle_focusout);
}


let quiz = Immutable.OrderedMap();
let events = [
    { number: 1, type: EVENT_ASK, text: "What is 1+1?" },
    { number: 1, type: EVENT_REMOTE_UPDATE, guess: "2" },
    { number: 1, type: EVENT_EDIT_START },
    { number: 1, type: EVENT_EDIT_COMPLETE, guess: "2" },
    { number: 2, type: EVENT_ASK, text: "What is 2+2?" },
    { number: 2, type: EVENT_EDIT_START },
    { number: 2, type: EVENT_REMOTE_UPDATE, guess: "1" },
    { number: 2, type: EVENT_EDIT_COMPLETE, guess: "4" },
]

for (let i = 0; i < events.length; i++) {
    setTimeout(() => {
        try {
            console.debug(`event: ${JSON.stringify(events[i])}`);
            quiz = update_quiz(quiz, events[i]);
            console.debug(`state: ${JSON.stringify(quiz)}`);
        } catch (err) {
            console.error(err);
        }
    }, i * 1000);
}
