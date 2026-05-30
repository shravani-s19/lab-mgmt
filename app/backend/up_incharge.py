import sqlite3
conn = sqlite3.connect("data/main_db.sqlite")

# Lab id, Incharge id mapping based on your data
updates = [
    (7, 4),   # Dr. Inderkumar Kochar → Hardware Lab 1
    (9, 5),   # Prof. Jayen Modi → Hardware Lab 2
    (10, 6),  # Prof. Archana P. Lopes → Computer Lab 1
    (11, 7),  # Dr. Swapnali Makdey → Computer Lab 2
    (13, 8),  # Prof. Prajakta Bhangale → Computer Lab 3
    (5, 9),   # Prof. Vaibhav Godbole → Computer Lab 4
    (14, 10), # Prof. Binsy Joseph → Electronics Lab
]

for incharge_id, lab_id in updates:
    conn.execute("UPDATE labs SET incharge_id = ? WHERE id = ?", (incharge_id, lab_id))
    print(f"Updated lab {lab_id} with incharge {incharge_id}")

conn.commit()
conn.close()
print("Done!")