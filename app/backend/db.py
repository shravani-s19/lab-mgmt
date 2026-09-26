"""PostgreSQL helpers for CRCE Lab Manager (Supabase compatible)."""
import os
import psycopg
from contextlib import contextmanager

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()


def _connect():
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not set. Add the Supabase PostgreSQL connection string in Render Environment."
        )

    conn = psycopg.connect(DATABASE_URL, connect_timeout=15)
    conn.autocommit = False
    return conn

@contextmanager
def main_db():
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@contextmanager
def lab_db(lab_id: int):
    # One Supabase PostgreSQL database; lab-specific data uses prefixed tables.
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def lab_db_path(lab_id: int):
    return None


def dict_row(cursor, row):
    if row is None:
        return None
    cols = [desc[0] for desc in cursor.description]
    return dict(zip(cols, row))


def dict_rows(cursor, rows):
    if not rows:
        return []
    cols = [desc[0] for desc in cursor.description]
    return [dict(zip(cols, row)) for row in rows]


def init_main_db():
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('ADMIN','ASSISTANT','STUDENT','INCHARGE')),
                roll_no TEXT,
                department TEXT,
                year TEXT,
                security_q1 TEXT,
                security_a1 TEXT,
                security_q2 TEXT,
                security_a2 TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS labs (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                capacity INTEGER NOT NULL DEFAULT 0,
                budget DOUBLE PRECISION NOT NULL DEFAULT 0,
                department TEXT,
                db_name TEXT NOT NULL,
                assistant_id INTEGER REFERENCES users(id),
                incharge_name TEXT,
                incharge_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


def init_lab_db(lab_id: int):
    lab_id = int(lab_id)
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS equipment_{lab_id} (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT,
                description TEXT,
                total_qty INTEGER NOT NULL DEFAULT 1,
                available_qty INTEGER NOT NULL DEFAULT 1,
                cost DOUBLE PRECISION DEFAULT 0,
                status TEXT DEFAULT 'AVAILABLE',
                purchase_date TEXT,
                supplier_name TEXT,
                serial_no TEXT,
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS requests_{lab_id} (
                id SERIAL PRIMARY KEY,
                equipment_id INTEGER NOT NULL REFERENCES equipment_{lab_id}(id),
                student_id INTEGER NOT NULL,
                student_name TEXT NOT NULL,
                student_email TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                purpose TEXT,
                status TEXT NOT NULL DEFAULT 'PENDING',
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_at TIMESTAMP,
                returned_at TIMESTAMP,
                due_date TIMESTAMP
            )
        """)
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS maintenance_{lab_id} (
                id SERIAL PRIMARY KEY,
                equipment_id INTEGER NOT NULL REFERENCES equipment_{lab_id}(id),
                description TEXT NOT NULL,
                cost DOUBLE PRECISION DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP
            )
        """)


def _table_exists(conn, table_name):
    cur = conn.cursor()
    cur.execute("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=%s)", (table_name,))
    return bool(cur.fetchone()[0])


def _get_columns(conn, table_name):
    cur = conn.cursor()
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=%s", (table_name,))
    return [row[0] for row in cur.fetchall()]


def migrate_lab_columns():
    with main_db() as conn:
        if not _table_exists(conn, "labs"):
            return
        columns = _get_columns(conn, "labs")
        additions = {
            "department": "TEXT",
            "assistant_id": "INTEGER",
            "incharge_name": "TEXT",
            "incharge_id": "INTEGER",
            "budget": "DOUBLE PRECISION DEFAULT 0",
            "db_name": "TEXT",
        }
        for name, sql_type in additions.items():
            if name not in columns:
                conn.execute(f"ALTER TABLE labs ADD COLUMN {name} {sql_type}")


def migrate_security_questions():
    with main_db() as conn:
        if not _table_exists(conn, "users"):
            return
        columns = _get_columns(conn, "users")
        for name in ("security_q1", "security_a1", "security_q2", "security_a2"):
            if name not in columns:
                conn.execute(f"ALTER TABLE users ADD COLUMN {name} TEXT")


def migrate_equipment_columns():
    with main_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM labs")
        lab_ids = [row[0] for row in cur.fetchall()]

    additions = {
        "category": "TEXT",
        "description": "TEXT",
        "cost": "DOUBLE PRECISION DEFAULT 0",
        "status": "TEXT DEFAULT 'AVAILABLE'",
        "purchase_date": "TEXT",
        "supplier_name": "TEXT",
        "serial_no": "TEXT",
        "remarks": "TEXT",
    }
    for lab_id in lab_ids:
        lab_id = int(lab_id)
        init_lab_db(lab_id)
        table_name = f"equipment_{lab_id}"
        with lab_db(lab_id) as conn:
            columns = _get_columns(conn, table_name)
            for name, sql_type in additions.items():
                if name not in columns:
                    conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {name} {sql_type}")
