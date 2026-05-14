import sqlite3
conn = sqlite3.connect("data/main_db.sqlite")
conn.executescript("""
    CREATE TABLE IF NOT EXISTS users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('ADMIN','ASSISTANT','STUDENT','INCHARGE')),
        roll_no TEXT,
        department TEXT,
        year TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );
    INSERT INTO users_new SELECT * FROM users;
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
""")
conn.commit()
conn.close()
print("Done!")