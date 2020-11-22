"use strict";

// Quiz events
const EVENT_JOIN             = 101;
const EVENT_ASK              = 102;
const EVENT_FOCUS            = 103;
const EVENT_BLUR             = 104;
const EVENT_GUESS            = 105;
const EVENT_LOCK             = 106;
const EVENT_REVEAL           = 107;

// Question states
const QUESTION_STATE_OPEN    = 201;
const QUESTION_STATE_EDITING = 202;
const QUESTION_STATE_SYNCING = 203;
const QUESTION_STATE_LOCKED  = 204;

// Question types
const QUESTION_KIND_TEXT     = 301
const QUESTION_KIND_IMAGE    = 302;
const QUESTION_KIND_AUDIO    = 303;
const QUESTION_KIND_VIDEO    = 304;
