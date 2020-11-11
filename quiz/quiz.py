import json
import sqlite3


class Quiz:
    def __init__(self, quizid, conn):
        self.quizid = quizid
        self.conn = conn

    @staticmethod
    def connection(quizid):
        conn = sqlite3.connect(f"db.{quizid}")
        conn.execute("PRAGMA foreign_keys = 1")
        return conn

    @classmethod
    def get(cls, quizid):
        conn = cls.connection(quizid)
        return cls(quizid, conn)

    @classmethod
    def new(cls, quizid):
        conn = cls.connection(quizid)
        with conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS teams (
                    number INTEGER PRIMARY KEY,
                    notes TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS questions (
                    number INTEGER PRIMARY KEY,
                    state INTEGER NOT NULL DEFAULT 0,
                    text TEXT NOT NULL,
                    answer TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS events (
                    seqnum INTEGER PRIMARY KEY,
                    team INTEGER NOT NULL,
                    player TEXT NOT NULL,
                    kind INTEGER NOT NULL,
                    question INTEGER NOT NULL,
                    data TEXT NOT NULL,
                    FOREIGN KEY(team) REFERENCES teams(number),
                    FOREIGN KEY(question) REFERENCES questions(number)
                );
                INSERT INTO teams(number, notes) VALUES (0, "");
            """
            )
        return cls(quizid, conn)

    @property
    def teams(self):
        with self.conn as conn:
            cur = conn.execute("SELECT number, notes FROM teams WHERE number != 0")
            return cur.fetchall()

    def add_team(self, notes):
        with self.conn as conn:
            conn.execute("INSERT INTO teams(notes) VALUES (?)", (notes,))

    def update_team(self, number, notes):
        with self.conn as conn:
            conn.execute(
                "UPDATE teams SET notes = ? WHERE number = ?",
                (notes, number),
            )

    def remove_team(self, number):
        with self.conn as conn:
            conn.execute("DELETE FROM teams WHERE number = ?", (number,))

    def add_question(self, text, answer):
        with self.conn as conn:
            conn.execute(
                "INSERT INTO questions(text, answer) VALUES (?, ?)",
                (text, answer),
            )

    def update_question_text(self, number, text):
        with self.conn as conn:
            conn.execute(
                "UPDATE questions SET text = ? WHERE number = ?",
                (text, number),
            )

    def update_question_answer(self, number, answer):
        with self.conn as conn:
            conn.execute(
                "UPDATE questions SET answer = ? WHERE number = ?",
                (answer, number),
            )

    def update_question_state(self, number, state):
        with self.conn as conn:
            conn.execute(
                "UPDATE questions SET state = ? WHERE number = ?",
                (state, number),
            )

    def remove_question(self, number):
        with self.conn as conn:
            conn.execute("DELETE FROM questions WHERE number = ?", (number,))

    def add_event(self, kind, team, player, question, data):
        with self.conn as conn:
            conn.execute(
                "INSERT INTO events(kind, team, player, question, data) VALUES (?, ?, ?, ?, ?)",
                (kind, team, player, question, json.dumps(data)),
            )

    def get_events_since(self, team, latest):
        with self.conn as conn:
            cur = conn.execute(
                """
                SELECT
                  seqnum,
                  kind,
                  team,
                  player,
                  question,
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
            return [{
                "seqnum": row[0],
                "kind": row[1],
                "team": row[2],
                "player": row[3],
                "question": row[4],
                "data": json.loads(row[5]),
            } for row in cur.fetchall()]

    @property
    def questions(self):
        with self.conn as conn:
            cur = conn.execute(
                "SELECT number, state, text, answer FROM questions ORDER BY number"
            )
            return cur.fetchall()

    def get_question_text(self, number):
        with self.conn as conn:
            cur = conn.execute("SELECT text FROM questions WHERE number = ?", (number,))
            return cur.fetchone()[0]

    def get_question_answer(self, number):
        with self.conn as conn:
            cur = conn.execute(
                "SELECT answer FROM questions WHERE number = ?", (number,)
            )
            return cur.fetchone()[0]
