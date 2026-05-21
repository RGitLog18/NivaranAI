import sqlite3
import os
import hashlib
import random

# Correct path to go one level up from 'data' folder to 'Backend'
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "citizen.db")

def hash_pw(password):
    return hashlib.sha256(password.encode()).hexdigest()

def seed_citizens():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # --- 1. REVOLUTIONARY FIX: Create table if it doesn't exist ---
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS citizens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            uid_number TEXT,
            password_hash TEXT,
            role TEXT DEFAULT 'citizen'
        )
    ''')

    # --- 2. Clean start for the demo ---
    cursor.execute("DELETE FROM citizens") 

    names = ["Aarav", "Ishani", "Vihaan", "Ananya", "Rohan", "Priya", "Aditya", "Saanvi", "Kabir", "Meera"]
    surnames = ["Patil", "Deshmukh", "Chavan", "Kulkarni", "Jadhav", "More", "Pawar", "Shinde", "Gaekwad", "Koli"]
    
    citizens = []
    for i in range(1, 51):
        full_name = f"{random.choice(names)} {random.choice(surnames)}"
        email = f"citizen{i}@nivaran.in"
        phone = f"9821630{i:03d}"
        uid = f"AADH-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
        # Match your exact column count: name, email, phone, uid_number, password_hash, role
        citizens.append((full_name, email, phone, uid, hash_pw("pass123"), "citizen"))

    # --- 3. Insert the 50 entries ---
    cursor.executemany('''
        INSERT INTO citizens (name, email, phone, uid_number, password_hash, role)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', citizens)

    conn.commit()
    conn.close()
    print(f"✅ [IDENTITY] 50 Citizens successfully injected into {DB_PATH}")

if __name__ == "__main__":
    seed_citizens()