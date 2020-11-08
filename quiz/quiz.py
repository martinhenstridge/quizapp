import sqlite3


class Quiz:

    def __init__(self, inst, conn):
        self.inst = inst
        self.conn = conn

    @staticmethod
    def connection(inst):
        return sqlite3.connect(f"quiz.{inst}.db")

    @classmethod
    def lookup(cls, inst):
        conn = cls.connection(inst)
        return cls(inst, conn)

    @classmethod
    def ensure(cls, inst):
        conn = cls.connection(inst)
        with conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS players (
                    name TEXT PRIMARY KEY,
                    team INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS questions (
                    number INTEGER PRIMARY KEY,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS events (
                    number INTEGER PRIMARY KEY,
                    player TEXT NOT NULL,
                    data TEXT NOT NULL,
                    FOREIGN KEY(player) REFERENCES players(name)
                );
            """)
        return cls(inst, conn)

    def add_player(self, name):
        with self.conn as conn:
            conn.execute("""
                INSERT INTO users(name, team) VALUES (?, ?);
            """, (name,))

    def set_player(self, name, team):
        with self.conn as conn:
            conn.execute("""
                UPDATE users SET team = ? WHERE name = ?;
            """, (team, name))

    def get_players(self):
        with self.conn as conn:
            cur = conn.execute("""
                SELECT name, team FROM users;
            """)
            return cur.fetchall()
