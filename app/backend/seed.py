""""Idempotent seed: 1 admin, 1 assistant, 1 student, 2 labs with equipment."""
from db import main_db, lab_db, init_lab_db
from auth import hash_password


def _get_or_create_user(conn, email, password, name, role, **extra):
    row = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if row:
        return row["id"]
    cur = conn.execute(
        "INSERT INTO users (email, password_hash, name, role, roll_no, department, year) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            email,
            hash_password(password),
            name,
            role,
            extra.get("roll_no"),
            extra.get("department"),
            extra.get("year"),
        ),
    )
    return cur.lastrowid


def _get_or_create_lab(conn, name, location, capacity, budget, department, assistant_id):
    row = conn.execute("SELECT id FROM labs WHERE name = ?", (name,)).fetchone()
    if row:
        return row["id"], False
    cur = conn.execute(
        "INSERT INTO labs (name, location, capacity, budget, department, db_name, assistant_id) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (name, location, capacity, budget, department, "pending", assistant_id),
    )
    lab_id = cur.lastrowid
    conn.execute(
        "UPDATE labs SET db_name = ? WHERE id = ?",
        (f"lab_{lab_id}.sqlite", lab_id),
    )
    return lab_id, True


def _seed_equipment(lab_id, items):
    with lab_db(lab_id) as conn:
        existing = conn.execute("SELECT COUNT(*) AS c FROM equipment").fetchone()["c"]
        if existing > 0:
            return
        for it in items:
            conn.execute(
                "INSERT INTO equipment (name, category, description, total_qty, available_qty, cost, status) "
                "VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE')",
                (
                    it["name"],
                    it["category"],
                    it.get("description", ""),
                    it["qty"],
                    it["qty"],
                    it.get("cost", 0),
                ),
            )


def run_seed():
    with main_db() as conn:
        admin_id = _get_or_create_user(
            conn, "admin@crce.edu", "Admin@123", "CRCE Admin", "ADMIN"
        )
        assistant_id = _get_or_create_user(
            conn,
            "assistant@crce.edu",
            "Assistant@123",
            "Riya Mehta",
            "ASSISTANT",
            department="Computer Engineering",
        )
        _get_or_create_user(
            conn,
            "student@crce.edu",
            "Student@123",
            "Aarav Sharma",
            "STUDENT",
            roll_no="CE-2026-014",
            department="Computer Engineering",
            year="TE",
        )
        lab1_id, lab1_new = _get_or_create_lab(
            conn,
            "Computer Lab 1",
            "Block A, Room 201",
            60,
            500000,
            "Computer Engineering",
            assistant_id,
        )
        lab2_id, lab2_new = _get_or_create_lab(
            conn,
            "Electronics Lab",
            "Block B, Room 105",
            45,
            350000,
            "Electronics Engineering",
            assistant_id,
        )

    init_lab_db(lab1_id)
    init_lab_db(lab2_id)

    _seed_equipment(
        lab1_id,
        [
            {"name": "Dell OptiPlex Desktop", "category": "Computer", "qty": 30, "cost": 45000, "description": "Intel i5, 16GB RAM"},
            {"name": "Raspberry Pi 5", "category": "SBC", "qty": 12, "cost": 8500, "description": "8GB RAM model"},
            {"name": "Arduino Uno R3", "category": "Microcontroller", "qty": 25, "cost": 1200},
            {"name": "Logitech HD Webcam", "category": "Peripheral", "qty": 10, "cost": 3000},
        ],
    )
    _seed_equipment(
        lab2_id,
        [
            {"name": "Digital Oscilloscope", "category": "Instrument", "qty": 6, "cost": 65000, "description": "100 MHz, 4 channel"},
            {"name": "Function Generator", "category": "Instrument", "qty": 8, "cost": 32000},
            {"name": "Soldering Station", "category": "Tool", "qty": 15, "cost": 4500},
            {"name": "Multimeter", "category": "Tool", "qty": 30, "cost": 1800},
        ],
    )
    print(f"[seed] Done. Labs: {lab1_id}, {lab2_id}. Admin/Assistant/Student ready.")
