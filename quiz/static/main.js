"use strict";

let quiz = new Quiz("#quiz");

quiz.update([
    {
        "kind":EVENT_INCOMING_ASK,
        "data":{"question":1,"kind":0,"text":"Text question","media":null},
    },
    {
        "kind":EVENT_INCOMING_ASK,
        "data":{"question":2,"kind":1,"text":"Image question","media":{"src":"url","mime":"image/jpeg"}},
    },
]);

quiz.update([
    {
        "kind":EVENT_LOCAL_FOCUS,
        "data":{"question":1},
    },
    {
        "kind":EVENT_LOCAL_EDIT,
        "data":{"question":1,"guess":"f"},
    },
    {
        "kind":EVENT_LOCAL_EDIT,
        "data":{"question":1,"guess":"fo"},
    },
    {
        "kind":EVENT_LOCAL_EDIT,
        "data":{"question":1,"guess":"foo"},
    },
]);

quiz.update([{
    "kind":EVENT_LOCAL_FOCUS,
    "data":{"question":2},
}]);
quiz.update([{
    "kind":EVENT_LOCAL_EDIT,
    "data":{"question":2,"guess":"f"},
}]);
quiz.update([{
    "kind":EVENT_LOCAL_EDIT,
    "data":{"question":2,"guess":""},
}]);

quiz.update([{
    "kind":EVENT_LOCAL_SUBMIT_SEND,
    "data":{"question":1},
}]);
quiz.update([{
    "kind":EVENT_LOCAL_SUBMIT_SUCCESS,
    "data":{"question":1},
}]);

//for (let [n, q] of quiz.questions) {
//    console.log(`${n}: ${JSON.stringify(q, null, 4)}`);
//}
//for (let [n, q] of quiz.questions) {
//    console.log(`${n}: ${JSON.stringify(q, null, 4)}`);
//}
