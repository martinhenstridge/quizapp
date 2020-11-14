from typing import Optional
from dataclasses import dataclass


@dataclass
class Question:
    number: int
    state: int
    kind: int
    text: str
    answer: str
    filename: Optional[str]
    mimetype: Optional[str]
