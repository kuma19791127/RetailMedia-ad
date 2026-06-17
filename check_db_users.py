import sqlite3
import json

print("--- SQLite Users ---")
try:
    conn = sqlite3.connect('retail_media.db')
    cursor = conn.cursor()
    cursor.execute("SELECT email, role FROM users")
    rows = cursor.fetchall()
    for row in rows:
        print(f"Email: {row[0]}, Role: {row[1]}")
    conn.close()
except Exception as e:
    print("Error querying SQLite:", e)

print("\n--- database.json Users ---")
try:
    with open('database.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        users = data.get('users', {})
        for email, uinfo in users.items():
            print(f"Email: {email}, Role: {uinfo.get('role')}")
except Exception as e:
    print("Error querying database.json:", e)
