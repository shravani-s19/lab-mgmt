"""SQLite database helpers for Laboratory Inventory & Equipment Management System."""

import sqlite3
from pathlib import Path
from contextlib import contextmanager


# ============================================================
# DATABASE PATH
# ============================================================

# db.py is inside:
# app/backend/db.py
#
# Database is inside:
# app/data/main_db.sqlite

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MAIN_DB_PATH = DATA_DIR / "main_db.sqlite"

# Create data folder automatically if it doesn't exist
DATA_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# SQLITE CONNECTION
# ============================================================

def _connect():
    conn = sqlite3.connect(
        str(MAIN_DB_PATH),
        check_same_thread=False
    )

    # Allows rows to behave like dictionaries:
    # row["email"], row["name"], etc.
    conn.row_factory = sqlite3.Row

    # Enable foreign keys in SQLite
    conn.execute("PRAGMA foreign_keys = ON")

    return conn


# ============================================================
# MAIN DATABASE CONNECTION
# ============================================================

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


# ============================================================
# LAB DATABASE CONNECTION
# ============================================================

# We are using one SQLite database.
# Each lab gets separate tables such as:
#
# equipment_1
# requests_1
# maintenance_1
#
# equipment_2
# requests_2
# maintenance_2
#
# etc.

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
    """
    All labs currently use the same SQLite database.
    """
    return MAIN_DB_PATH


# ============================================================
# ROW CONVERSION HELPERS
# ============================================================

def dict_row(cursor, row):
    if row is None:
        return None

    # sqlite3.Row can directly be converted to dict
    if isinstance(row, sqlite3.Row):
        return dict(row)

    cols = [desc[0] for desc in cursor.description]
    return dict(zip(cols, row))


def dict_rows(cursor, rows):
    if not rows:
        return []

    if isinstance(rows[0], sqlite3.Row):
        return [dict(row) for row in rows]

    cols = [desc[0] for desc in cursor.description]
    return [dict(zip(cols, row)) for row in rows]


# ============================================================
# INITIALIZE MAIN DATABASE
# ============================================================

def init_main_db():

    with main_db() as conn:

        cur = conn.cursor()

        # ----------------------------------------------------
        # USERS TABLE
        # ----------------------------------------------------

        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                email TEXT UNIQUE NOT NULL,

                password_hash TEXT NOT NULL,

                name TEXT NOT NULL,

                role TEXT NOT NULL
                CHECK (
                    role IN (
                        'ADMIN',
                        'ASSISTANT',
                        'STUDENT',
                        'INCHARGE'
                    )
                ),

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


        # ----------------------------------------------------
        # LABS TABLE
        # ----------------------------------------------------

        cur.execute("""
            CREATE TABLE IF NOT EXISTS labs (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                name TEXT NOT NULL,

                location TEXT NOT NULL,

                capacity INTEGER NOT NULL DEFAULT 0,

                budget REAL NOT NULL DEFAULT 0,

                department TEXT,

                db_name TEXT NOT NULL,

                assistant_id INTEGER,

                incharge_name TEXT,

                incharge_id INTEGER,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (assistant_id)
                REFERENCES users(id),

                FOREIGN KEY (incharge_id)
                REFERENCES users(id)
            )
        """)


# ============================================================
# INITIALIZE LAB TABLES
# ============================================================

def init_lab_db(lab_id: int):

    # Safety: make sure lab_id is integer
    lab_id = int(lab_id)

    with main_db() as conn:

        cur = conn.cursor()


        # ----------------------------------------------------
        # EQUIPMENT TABLE
        # ----------------------------------------------------

        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS equipment_{lab_id} (

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

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


        # ----------------------------------------------------
        # REQUESTS TABLE
        # ----------------------------------------------------

        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS requests_{lab_id} (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                equipment_id INTEGER NOT NULL,

                student_id INTEGER NOT NULL,

                student_name TEXT NOT NULL,

                student_email TEXT NOT NULL,

                quantity INTEGER NOT NULL DEFAULT 1,

                purpose TEXT,

                status TEXT NOT NULL DEFAULT 'PENDING',

                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                approved_at TIMESTAMP,

                returned_at TIMESTAMP,

                due_date TIMESTAMP,

                FOREIGN KEY (equipment_id)
                REFERENCES equipment_{lab_id}(id)
            )
        """)


        # ----------------------------------------------------
        # MAINTENANCE TABLE
        # ----------------------------------------------------

        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS maintenance_{lab_id} (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                equipment_id INTEGER NOT NULL,

                description TEXT NOT NULL,

                cost REAL DEFAULT 0,

                status TEXT NOT NULL DEFAULT 'IN_PROGRESS',

                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                completed_at TIMESTAMP,

                FOREIGN KEY (equipment_id)
                REFERENCES equipment_{lab_id}(id)
            )
        """)


# ============================================================
# MIGRATION HELPERS
# ============================================================

def _get_columns(conn, table_name):

    cur = conn.cursor()

    cur.execute(f"PRAGMA table_info({table_name})")

    return [row["name"] for row in cur.fetchall()]


# ============================================================
# LAB TABLE MIGRATION
# ============================================================

def migrate_lab_columns():

    with main_db() as conn:

        columns = _get_columns(conn, "labs")

        if "department" not in columns:
            conn.execute(
                "ALTER TABLE labs ADD COLUMN department TEXT"
            )

        if "assistant_id" not in columns:
            conn.execute(
                "ALTER TABLE labs ADD COLUMN assistant_id INTEGER"
            )

        if "incharge_name" not in columns:
            conn.execute(
                "ALTER TABLE labs ADD COLUMN incharge_name TEXT"
            )

        if "incharge_id" not in columns:
            conn.execute(
                "ALTER TABLE labs ADD COLUMN incharge_id INTEGER"
            )

        if "budget" not in columns:
            conn.execute(
                "ALTER TABLE labs ADD COLUMN budget REAL DEFAULT 0"
            )

        if "db_name" not in columns:
            conn.execute(
                "ALTER TABLE labs ADD COLUMN db_name TEXT"
            )


# ============================================================
# SECURITY QUESTION MIGRATION
# ============================================================

def migrate_security_questions():

    with main_db() as conn:

        columns = _get_columns(conn, "users")

        if "security_q1" not in columns:
            conn.execute(
                "ALTER TABLE users ADD COLUMN security_q1 TEXT"
            )

        if "security_a1" not in columns:
            conn.execute(
                "ALTER TABLE users ADD COLUMN security_a1 TEXT"
            )

        if "security_q2" not in columns:
            conn.execute(
                "ALTER TABLE users ADD COLUMN security_q2 TEXT"
            )

        if "security_a2" not in columns:
            conn.execute(
                "ALTER TABLE users ADD COLUMN security_a2 TEXT"
            )


# ============================================================
# EQUIPMENT TABLE MIGRATION
# ============================================================

def migrate_equipment_columns():

    with main_db() as conn:

        labs = conn.execute(
            "SELECT id FROM labs"
        ).fetchall()

    for lab in labs:

        lab_id = lab["id"]

        # Ensure tables exist first
        init_lab_db(lab_id)

        with lab_db(lab_id) as conn:

            table_name = f"equipment_{int(lab_id)}"

            columns = _get_columns(
                conn,
                table_name
            )

            if "category" not in columns:
                conn.execute(
                    f"""
                    ALTER TABLE {table_name}
                    ADD COLUMN category TEXT
                    """
                )

            if "description" not in columns:
                conn.execute(
                    f"""
                    ALTER TABLE {table_name}
                    ADD COLUMN description TEXT
                    """
                )

            if "cost" not in columns:
                conn.execute(
                    f"""
                    ALTER TABLE {table_name}
                    ADD COLUMN cost REAL DEFAULT 0
                    """
                )

            if "status" not in columns:
                conn.execute(
                    f"""
                    ALTER TABLE {table_name}
                    ADD COLUMN status TEXT DEFAULT 'AVAILABLE'
                    """
                )

            if "purchase_date" not in columns:
                conn.execute(
                    f"""
                    ALTER TABLE {table_name}
                    ADD COLUMN purchase_date TEXT
                    """
                )

            if "supplier_name" not in columns:
                conn.execute(
                    f"""
                    ALTER TABLE {table_name}
                    ADD COLUMN supplier_name TEXT
                    """
                )

            if "serial_no" not in columns:
                conn.execute(
                    f"""
                    ALTER TABLE {table_name}
                    ADD COLUMN serial_no TEXT
                    """
                )

            if "remarks" not in columns:
                conn.execute(
                    f"""
                    ALTER TABLE {table_name}
                    ADD COLUMN remarks TEXT
                    """
                )