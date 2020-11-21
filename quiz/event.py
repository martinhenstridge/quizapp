from enum import Enum


class EventKind(Enum):
    JOIN = 101
    ASK = 102
    FOCUS = 103
    BLUR = 104
    GUESS = 105
    LOCK = 106
    REVEAL = 107
