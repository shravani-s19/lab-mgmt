import sqlite3
conn = sqlite3.connect("data/main_db.sqlite")

labs = conn.execute("SELECT id, name, incharge_id FROM labs").fetchall()
print("Labs:", [tuple(l) for l in labs])

users = conn.execute("SELECT id, name, role FROM users WHERE role = 'INCHARGE'").fetchall()
print("Incharges:", [tuple(u) for u in users])

conn.close()