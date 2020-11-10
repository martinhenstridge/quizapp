import sqlite3


class Quiz:
    def __init__(self, inst, conn):
        self.inst = inst
        self.conn = conn

    @staticmethod
    def connection(inst):
        return sqlite3.connect(f"db.{inst}")

    @classmethod
    def get(cls, inst):
        conn = cls.connection(inst)
        return cls(inst, conn)

    @classmethod
    def new(cls, inst):
        conn = cls.connection(inst)
        with conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS players (
                    name TEXT PRIMARY KEY,
                    team INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS questions (
                    number INTEGER PRIMARY KEY,
                    type INTEGER NOT NULL,
                    text TEXT NOT NULL,
                    data BLOB,
                    answer TEXT NOT NULL,
                    CHECK (type = 0 OR data IS NOT NULL)
                );
                CREATE TABLE IF NOT EXISTS events (
                    number INTEGER PRIMARY KEY,
                    player TEXT NOT NULL,
                    data TEXT NOT NULL,
                    FOREIGN KEY(player) REFERENCES players(name)
                );
            """
            )
        return cls(inst, conn)

    def add_player(self, name, team):
        with self.conn as conn:
            conn.execute(
                """
                INSERT INTO players(name, team) VALUES (?, ?);
            """,
                (name, team),
            )

    def set_player(self, name, team):
        with self.conn as conn:
            conn.execute(
                """
                UPDATE players SET team = ? WHERE name = ?;
            """,
                (team, name),
            )

    @property
    def players(self):
        with self.conn as conn:
            cur = conn.execute(
                """
                SELECT name, team FROM players;
            """
            )
            return cur.fetchall()
