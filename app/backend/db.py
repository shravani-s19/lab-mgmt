"""""SQLite multi-database helpers for CRCE Lab Manager.

Architecture:
- main_db.sqlite: users, labs (registry), assignments
- lab_<id>.sqlite: per-lab equipment, requests, maintenance
"""
import os
import sqlite3
from pathlib import Path
from contextlib import contextmanager

SQLITE_DIR = Path(os.environ.get("SQLITE_DIR", "/app/backend/data"))
SQLITE_DIR.mkdir(parents=True, exist_ok=True)

MAIN_DB_PATH = SQLITE_DIR / "main_db.sqlite"


def _connect(path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(str(path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def main_db():
    conn = _connect(MAIN_DB_PATH)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def lab_db_path(lab_id: int) -> Path:
    return SQLITE_DIR / f"lab_{lab_id}.sqlite"


@contextmanager
def lab_db(lab_id: int):
    path = lab_db_path(lab_id)
    conn = _connect(path)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_main_db():
    with main_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('ADMIN','ASSISTANT','STUDENT')),
                roll_no TEXT,
                department TEXT,
                year TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS labs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                capacity INTEGER NOT NULL DEFAULT 0,
                budget REAL NOT NULL DEFAULT 0,
                department TEXT,
                db_name TEXT NOT NULL,
                assistant_id INTEGER,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (assistant_id) REFERENCES users(id)
            );
            """
        )


def init_lab_db(lab_id: int):
    with lab_db(lab_id) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS equipment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                description TEXT,
                total_qty INTEGER NOT NULL DEFAULT 1,
                available_qty INTEGER NOT NULL DEFAULT 1,
                cost REAL DEFAULT 0,
                status TEXT DEFAULT 'AVAILABLE',
                purchase_date TEXT,
                supplier_name TEXT,
                serial_no TEXT,
                remarks TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                equipment_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                student_name TEXT NOT NULL,
                student_email TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                purpose TEXT,
                status TEXT NOT NULL DEFAULT 'PENDING',
                requested_at TEXT DEFAULT (datetime('now')),
                approved_at TEXT,
                returned_at TEXT,
                due_date TEXT,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id)
            );
            CREATE TABLE IF NOT EXISTS maintenance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                equipment_id INTEGER NOT NULL,
                description TEXT NOT NULL,
                cost REAL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
                started_at TEXT DEFAULT (datetime('now')),
                completed_at TEXT,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id)
            );
            """
        )

def migrate_equipment_columns():
    import sqlite3
    for path in SQLITE_DIR.glob("lab_*.sqlite"):
        conn = _connect(path)
        for col, typedef in [
            ("purchase_date", "TEXT"),
            ("supplier_name", "TEXT"),
            ("serial_no", "TEXT"),
            ("remarks", "TEXT"),
        ]:
            try:
                conn.execute(f"ALTER TABLE equipment ADD COLUMN {col} {typedef}")
                conn.commit()
            except sqlite3.OperationalError:
                pass
        conn.close()