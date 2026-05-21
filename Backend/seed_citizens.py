import sqlite3
import os
import hashlib

# Configuration based on takeimage.py
GOVERNMENT_DB = "government.db"

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def seed_citizens():
    conn = sqlite3.connect(GOVERNMENT_DB)
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute("DELETE FROM citizens")
    
    # Data based on takeimage.py attributes: name, email, phone, uid_number, password_hash
    citizens = [
        ("Deepak Kumar", "d@gmail.com", "9821630502", "46863", hash_password("123")),
        ("Sakshi Chavan", "s@gmail.com", "9321630502", "112233", hash_password("456"))
    ]
    
    cursor.executemany('''
        INSERT INTO citizens (name, email, phone, uid_number, password_hash, role) 
        VALUES (?, ?, ?, ?, ?, 'citizen')
    ''', citizens)
    
    conn.commit()
    conn.close()
    print("✅ seed_citizens.py: Citizens seeded successfully.")

if __name__ == "__main__":
    seed_citizens()