from enum import Enum
from typing import Optional
from dataclasses import dataclass


class QuestionState(Enum):
    WAIT = 0
    ASKED = 1
    LOCKED = 2
    REVEALED = 3


class QuestionKind(Enum):
    TEXT = 301
    IMAGE = 302
    AUDIO = 303
    VIDEO = 304


@dataclass
class Question:
    number: int
    state: QuestionState
    kind: QuestionKind
    text: str
    answer: str
    filename: Optional[str]
    mimetype: Optional[str]
