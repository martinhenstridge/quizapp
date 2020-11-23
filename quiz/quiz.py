from __future__ import annotations
import os
import json
import sqlite3
from typing import Any, Dict, List, Optional, Tuple
from .event import EventKind
from .question import Question, QuestionKind, QuestionState


class Quiz:

    STORAGE: str

    def __init__(
        self, quizid: str, dbfile: str, assets: str, conn: sqlite3.Connection
    ) -> None:
        self.quizid = quizid
        self.dbfile = dbfile
        self.assets = assets
        self.conn = conn

    @classmethod
    def _dbfile(cls, quizid: str) -> str:
        path = os.path.join(cls.STORAGE, quizid, "database")
        return os.path.abspath(path)

    @classmethod
    def _assets(cls, quizid: str) -> str:
        path = os.path.join(cls.STORAGE, quizid, "assets")
        return os.path.abspath(path)

    @classmethod
    def _connect(cls, dbfile: str) -> sqlite3.Connection:
        conn = sqlite3.connect(dbfile)
        conn.execute("PRAGMA foreign_keys = 1")
        return conn

    @classmethod
    def get(cls, quizid: str) -> Quiz:
        dbfile = cls._dbfile(quizid)
        assets = cls._assets(quizid)
        conn = cls._connect(dbfile)
        return cls(quizid, dbfile, assets, conn)

    @classmethod
    def new(cls, quizid: str) -> Quiz:
        dbfile = cls._dbfile(quizid)
        assets = cls._assets(quizid)

        # Ensure the directory structure is in place before attempting to
        # connect to (read: create) the database.
        os.makedirs(assets, exist_ok=True)
        conn = cls._connect(dbfile)

        with conn:
            conn.executescript(
                """
                -- Table: teams
                CREATE TABLE IF NOT EXISTS teams (
                  number INTEGER PRIMARY KEY,
                  password TEXT NOT NULL,
                  notes TEXT NOT NULL
                );
                INSERT INTO teams(number, password, notes) VALUES (0, "......", "");

                -- Table: questions
                CREATE TABLE IF NOT EXISTS questions (
                  number INTEGER PRIMARY KEY,
                  state INTEGER NOT NULL,
                  kind INTEGER NOT NULL,
                  text TEXT NOT NULL,
                  answer TEXT NOT NULL,
                  filename TEXT,
                  mimetype TEXT,
                  CHECK (kind = 301 OR (filename IS NOT NULL AND mimetype IS NOT NULL))
                );
                CREATE INDEX index_filename ON questions(filename);

                -- Table: events
                CREATE TABLE IF NOT EXISTS events (
                  seqnum INTEGER PRIMARY KEY,
                  at INTEGER NOT NULL,
                  kind INTEGER NOT NULL,
                  data TEXT NOT NULL,
                  team INTEGER NOT NULL,
                  FOREIGN KEY(team) REFERENCES teams(number)
                );
            """
            )
        return cls(quizid, dbfile, assets, conn)

    @property
    def teams(self) -> List[Tuple[str, str, str]]:
        with self.conn as conn:
            cur = conn.execute("SELECT number, password, notes FROM teams WHERE number != 0")
            return cur.fetchall()

    def add_team(self, notes: str, password: str) -> None:
        with self.conn as conn:
            conn.execute(
                """
                INSERT INTO
                  teams (
                    password,
                    notes)
                VALUES (?, ?)
            """,
                (password, notes),
            )

    def update_team(self, number: int, notes: str) -> None:
        with self.conn as conn:
            conn.execute(
                "UPDATE teams SET notes = ? WHERE number = ?",
                (notes, number),
            )

    def remove_team(self, number: int) -> None:
        with self.conn as conn:
            conn.execute("DELETE FROM teams WHERE number = ?", (number,))

    def add_question(
        self,
        kind: QuestionKind,
        text: str,
        answer: str,
        filename: Optional[str],
        mimetype: Optional[str],
    ) -> None:
        with self.conn as conn:
            conn.execute(
                """
                INSERT INTO
                  questions (
                    state,
                    kind,
                    text,
                    answer,
                    filename,
                    mimetype)
                VALUES
                  (0, ?, ?, ?, ?, ?)
                """,
                (kind, text, answer, filename, mimetype),
            )

    def update_question_text(self, number: int, text: str) -> None:
        with self.conn as conn:
            conn.execute(
                "UPDATE questions SET text = ? WHERE number = ?",
                (text, number),
            )

    def update_question_answer(self, number: int, answer: str) -> None:
        with self.conn as conn:
            conn.execute(
                "UPDATE questions SET answer = ? WHERE number = ?",
                (answer, number),
            )

    def update_question_state(self, number: int, state: QuestionState) -> None:
        with self.conn as conn:
            conn.execute(
                "UPDATE questions SET state = ? WHERE number = ?",
                (state.value, number),
            )

    def remove_question(self, number: int) -> None:
        with self.conn as conn:
            conn.execute("DELETE FROM questions WHERE number = ?", (number,))

    def add_event(
        self,
        kind: EventKind,
        data: Dict[str, Any],
        team: int,
        player: str,
    ) -> None:
        data["player"] = player
        with self.conn as conn:
            conn.execute(
                """
                INSERT INTO
                  events (
                    at,
                    kind,
                    data,
                    team)
                VALUES (DATETIME("now"), ?, ?, ?)
                """,
                (kind.value, json.dumps(data), team),
            )

    def get_events_since(self, team: int, latest: int) -> List[Dict[str, Any]]:
        with self.conn as conn:
            cur = conn.execute(
                """
                SELECT
                  seqnum,
                  at,
                  kind,
                  data
                FROM
                  events
                WHERE
                  seqnum > ? AND (team = 0 OR team = ?)
                ORDER BY
                  seqnum
            """,
                (latest, team),
            )
            return [
                {
                    "seqnum": row[0],
                    "timestamp": row[1],
                    "kind": row[2],
                    "data": json.loads(row[3]),
                }
                for row in cur.fetchall()
            ]

    @property
    def questions(self) -> List[Question]:
        with self.conn as conn:
            cur = conn.execute(
                """
                SELECT
                  number,
                  state,
                  kind,
                  text,
                  answer,
                  filename,
                  mimetype
                FROM
                  questions
                ORDER BY
                  number
                """
            )
            return [
                Question(
                    row[0],
                    QuestionState(row[1]),
                    QuestionKind(row[2]),
                    row[3],
                    row[4],
                    row[5],
                    row[6],
                )
                for row in cur.fetchall()
            ]

    def get_question(self, number: int) -> Question:
        with self.conn as conn:
            cur = conn.execute(
                """
                SELECT
                  number,
                  state,
                  kind,
                  text,
                  answer,
                  filename,
                  mimetype
                FROM
                  questions
                WHERE
                  number = ?
                """,
                (number,),
            )
            row = cur.fetchone()
            return Question(
                row[0],
                QuestionState(row[1]),
                QuestionKind(row[2]),
                row[3],
                row[4],
                row[5],
                row[6],
            )

    def get_asset_mimetype(self, filename: str) -> str:
        with self.conn as conn:
            cur = conn.execute(
                "SELECT mimetype FROM questions WHERE filename = ?", (filename,)
            )
            return cur.fetchone()[0]
