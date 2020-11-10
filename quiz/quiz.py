import sqlite3


class Quiz:
    def __init__(self, key, conn):
        self.key = key
        self.conn = conn

    @staticmethod
    def connection(key):
        return sqlite3.connect(f"db.{key}")

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
                    text TEXT NOT NULL,
                    answer TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS events (
                    number INTEGER PRIMARY KEY,
                    player TEXT NOT NULL,
                    data TEXT NOT NULL,
                    FOREIGN KEY(player) REFERENCES players(name)
                );
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

    def remove_question(self, number):
        with self.conn as conn:
            conn.execute("DELETE FROM questions WHERE number = ?", (number,))

    @property
    def players(self):
        with self.conn as conn:
            cur = conn.execute("SELECT name, team FROM players ORDER BY team, name")
            return cur.fetchall()

    @property
    def questions(self):
        with self.conn as conn:
            cur = conn.execute(
                "SELECT number, text, answer FROM questions ORDER BY number"
            )
            return cur.fetchall()
