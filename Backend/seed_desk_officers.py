import sqlite3
import os
import hashlib

# Absolute path logic
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "government.db")

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def seed_desk_officers():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Ensure Table Schema exists
    cursor.execute('''CREATE TABLE IF NOT EXISTS government_officers (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT, 
            email TEXT UNIQUE, 
            phone TEXT, 
            location TEXT, 
            uid_number TEXT, 
            proof_path TEXT,
            password_hash TEXT, 
            role TEXT,
            admin_domain TEXT,
            admin_role TEXT, 
            admin_body TEXT, 
            specific_role TEXT, 
            workspace_code TEXT,
            is_setup INTEGER DEFAULT 0,
            is_setup_complete INTEGER DEFAULT 0,
            onboarding_step INTEGER DEFAULT 1,
            is_onboarded INTEGER DEFAULT 0)''')

    # Data List for Desk Officers
    # Workspace: ERAD-1 | Location: Nerul West | Role: Desk_Officer
    hashed_pass = hash_password("pass")
    
    desk_officers = [
        ("Sakshi Sawant", "sakshi@co.in", "9988776655", "Nerul West", "DO-501", "id.pdf", hashed_pass, "government", "Desk_Officer", "Municipal", "Triage Supervisor", "ERAD-1", 1, 1, 10, 1),
        ("Rahul Verma", "rahul@co.in", "9876543210", "Nerul West", "DO-502", "id.pdf", hashed_pass, "government", "Desk_Officer", "Municipal", "Field Dispatcher", "ERAD-1", 1, 1, 10, 1),
        ("Priya Singh", "priya@co.in", "9123456789", "Nerul West", "DO-503", "id.pdf", hashed_pass, "government", "Desk_Officer", "Municipal", "Compliance Officer", "ERAD-1", 1, 1, 10, 1)
    ]
    
    # Using REPLACE to ensure we can run this multiple times to update existing entries
    cursor.executemany('''
        INSERT OR REPLACE INTO government_officers (
            name, email, phone, location, uid_number, proof_path, 
            password_hash, role, admin_role, admin_body, 
            specific_role, workspace_code, is_setup, 
            is_setup_complete, onboarding_step, is_onboarded
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ''', desk_officers)
    
    conn.commit()
    conn.close()
    print("✅ Desk Officers for Workspace ERAD-1 (Nerul West) Seeded successfully.")

if __name__ == "__main__":
    seed_desk_officers()