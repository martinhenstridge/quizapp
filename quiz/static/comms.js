"use strict";


function push(data) {
    const request = {
       method: "POST",
       cache: "no-store",
       credentials: "same-origin",
       mode: "same-origin",
       headers: {
           "Content-Type": "application/json",
       },
       body: JSON.stringify(data),
    };

    return fetch("events", request)
        .then(_status)
        .then(_json)
}


function poll(latest) {
    const request = {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        mode: "same-origin",
    };

    return fetch(`events?since=${latest}`, request)
        .then(_status)
        .then(_json)
}


function _status(response) {
    if (!response.ok) {
        throw reponse.statusText;
    }
    return response;
}


function _json(response) {
    return response.json();
}
