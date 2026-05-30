import sqlite3
conn = sqlite3.connect("data/main_db.sqlite")
try:
    conn.execute("ALTER TABLE labs ADD COLUMN incharge_id INTEGER")
    print("Added incharge_id")
except:
    print("incharge_id already exists")
try:
    conn.execute("ALTER TABLE labs ADD COLUMN incharge_name TEXT")
    print("Added incharge_name")
except:
    print("incharge_name already exists")
conn.commit()
conn.close()
print("Done!")