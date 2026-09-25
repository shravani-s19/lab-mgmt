""""Idempotent seed: 1 admin, 1 assistant, 1 student, 2 labs with equipment."""
from db import main_db
from auth import hash_password

def _get_or_create_user(conn, email, password, name, role, **extra):
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        "INSERT INTO users (email, password_hash, name, role, roll_no, department, year) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
        (email, hash_password(password), name, role,
         extra.get("roll_no"), extra.get("department"), extra.get("year")),
    )
    return cur.fetchone()[0]

def run_seed():
    with main_db() as conn:
        _get_or_create_user(
            conn, "admin@crce.edu", "Admin@123", "CRCE Admin", "ADMIN"
        )
    print("[seed] Done. Admin ready.")