import json
import sqlite3


class Quiz:
    def __init__(self, key, conn):
        self.key = key
        self.conn = conn

    @staticmethod
    def connection(key):
        conn = sqlite3.connect(f"db.{key}")
        conn.execute("PRAGMA foreign_keys = 1")
        return conn

    @classmethod
    def get(cls, key):
        conn = cls.connection(key)
        return cls(key, conn)

    @classmethod
    def new(cls, key):
        conn = cls.connection(key)
        with conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS players (
                    name TEXT PRIMARY KEY,
                    team INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS questions (
                    number INTEGER PRIMARY KEY,
                    state INTEGER NOT NULL DEFAULT 0,
                    text TEXT NOT NULL,
                    answer TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS events (
                    seqnum INTEGER PRIMARY KEY,
                    player TEXT NOT NULL,
                    event INTEGER NOT NULL,
                    data TEXT NOT NULL,
                    FOREIGN KEY(player) REFERENCES players(name)
                );
                INSERT INTO players(name, team) VALUES ("_", -1);
            """
            )
        return cls(key, conn)

    def add_player(self, name, team):
        with self.conn as conn:
            conn.execute(
                "INSERT INTO players(name, team) VALUES (?, ?)",
                (name, team),
            )

    def update_player(self, name, team):
        with self.conn as conn:
            conn.execute(
                "UPDATE players SET team = ? WHERE name = ?",
                (team, name),
            )

    def remove_player(self, name):
        with self.conn as conn:
            conn.execute("DELETE FROM players WHERE name = ?", (name,))

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

    def post_event(self, player, event, data):
        with self.conn as conn:
            conn.execute(
                "INSERT INTO events(player, event, data) VALUES (?, ?, ?)",
                (player, event, json.dumps(data)),
            )

    def get_events_since(self, player, latest):
        with self.conn as conn:
            cur = conn.execute("SELECT team FROM players WHERE name  = ?", (player,))
            team = cur.fetchone()

            cur = conn.execute("""
                SELECT
                  seqnum,
                  player,
                  event,
                  data
                FROM
                  events
                  INNER JOIN players ON events.player = players.name
                WHERE
                  seqnum > ? AND (players.team = -1 OR players.team = ?)
                ORDER BY
                  seqnum
            """, (latest, team))
            return cur.fetchall()

    @property
    def players(self):
        with self.conn as conn:
            cur = conn.execute("""
                SELECT
                  name,
                  team
                FROM
                  players
                WHERE
                  name != "_"
                ORDER BY
                  team, name
            """)
            return cur.fetchall()

    @property
    def questions(self):
        with self.conn as conn:
            cur = conn.execute(
                "SELECT number, state, text, answer FROM questions ORDER BY number"
            )
            return cur.fetchall()

    def get_question_text(self, number):
        with self.conn as conn:
            cur = conn.execute(
                "SELECT text FROM questions WHERE number = ?", (number,)
            )
            return cur.fetchone()

    def get_question_answer(self, number):
        with self.conn as conn:
            cur = conn.execute(
                "SELECT answer FROM questions WHERE number = ?", (number,)
            )
            return cur.fetchone()
