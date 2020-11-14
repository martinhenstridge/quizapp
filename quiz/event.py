from enum import Enum


class EventKind(Enum):
    ASK = 1
    FOCUSIN = 2
    FOCUSOUT = 3
    GUESS = 4
    LOCK = 5
    REVEAL = 6
