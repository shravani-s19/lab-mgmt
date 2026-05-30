"""PostgreSQL multi-database helpers for CRCE Lab Manager."""
import os
import psycopg
from contextlib import contextmanager

DATABASE_URL = os.environ.get("DATABASE_URL", "")

def _connect():
    conn = psycopg.connect(DATABASE_URL)
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

# Keep lab_db as alias to main_db since we use one PostgreSQL database
# with prefixed tables instead of separate sqlite files
@contextmanager
def lab_db(lab_id: int):
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
    return None  # Not used with PostgreSQL

def dict_row(cursor, row):
    if row is None:
        return None
    cols = [desc[0] for desc in cursor.description]
    return dict(zip(cols, row))

def dict_rows(cursor, rows):
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
                role TEXT NOT NULL CHECK(role IN ('ADMIN','ASSISTANT','STUDENT','INCHARGE')),
                roll_no TEXT,
                department TEXT,
                year TEXT,
                security_q1 TEXT,
                security_a1 TEXT,
                security_q2 TEXT,
                security_a2 TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS labs (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                capacity INTEGER NOT NULL DEFAULT 0,
                budget REAL NOT NULL DEFAULT 0,
                department TEXT,
                db_name TEXT NOT NULL,
                assistant_id INTEGER,
                incharge_name TEXT,
                incharge_id INTEGER,
                created_at TIMESTAMP DEFAULT NOW(),
                FOREIGN KEY (assistant_id) REFERENCES users(id)
            );
        """)

def init_lab_db(lab_id: int):
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
                cost REAL DEFAULT 0,
                status TEXT DEFAULT 'AVAILABLE',
                purchase_date TEXT,
                supplier_name TEXT,
                serial_no TEXT,
                remarks TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS requests_{lab_id} (
                id SERIAL PRIMARY KEY,
                equipment_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                student_name TEXT NOT NULL,
                student_email TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                purpose TEXT,
                status TEXT NOT NULL DEFAULT 'PENDING',
                requested_at TIMESTAMP DEFAULT NOW(),
                approved_at TIMESTAMP,
                returned_at TIMESTAMP,
                due_date TIMESTAMP,
                FOREIGN KEY (equipment_id) REFERENCES equipment_{lab_id}(id)
            );
            CREATE TABLE IF NOT EXISTS maintenance_{lab_id} (
                id SERIAL PRIMARY KEY,
                equipment_id INTEGER NOT NULL,
                description TEXT NOT NULL,
                cost REAL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
                started_at TIMESTAMP DEFAULT NOW(),
                completed_at TIMESTAMP,
                FOREIGN KEY (equipment_id) REFERENCES equipment_{lab_id}(id)
            );
        """)

def migrate_equipment_columns():
    pass  # Already handled in init_main_db with full schema

def migrate_lab_columns():
    pass  # Already handled in init_main_db with full schema

def migrate_security_questions():
    pass  # Already included in schema