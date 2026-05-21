# data/seed_officers.py
import sqlite3
import os
import hashlib

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "government.db")

def hash_pw(password):
    return hashlib.sha256(password.encode()).hexdigest()

def seed_officers():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # --- SCHEMA INITIALIZATION ---
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
            admin_role TEXT, 
            admin_body TEXT, 
            specific_role TEXT, 
            workspace_code TEXT,
            is_setup INTEGER DEFAULT 0,
            is_setup_complete INTEGER DEFAULT 0,
            onboarding_step INTEGER DEFAULT 1,
            is_onboarded INTEGER DEFAULT 0)''')

    cursor.execute("DELETE FROM government_officers")

    # 10 Professional roles for testing
    officers = [
        # Admins
        ("Sakshi Chavan", "admin@nivaran.gov", "9967586511", "Dombivli East", "GOV-001", "id.pdf", hash_pw("admin123"), "government", "Admin", "Municipal Corporation", "Commissioner", "DOM-E-2026", 1, 1, 9, 1),
        ("Ganpat Patil", "sarpanch@nivaran.gov", "9820011223", "Kalyan", "GOV-002", "id.pdf", hash_pw("pass123"), "government", "Admin", "Gram Panchayat", "Sarpanch", "KAL-W-2026", 1, 1, 9, 1),
        
        # Desk Officers (Dombivli East)
        ("JE Ramesh", "roads.je@nivaran.gov", "9000000001", "Dombivli East", "GOV-003", "id.pdf", hash_pw("pass123"), "government", "Desk_Officer", "Municipal Corporation", "Junior Engineer", "DOM-E-2026", 1, 1, 9, 1),
        ("Inspector Suresh", "waste.insp@nivaran.gov", "9000000002", "Dombivli East", "GOV-004", "id.pdf", hash_pw("pass123"), "government", "Desk_Officer", "Municipal Corporation", "Sanitary Inspector", "DOM-E-2026", 1, 1, 9, 1),
        ("JE Mahesh", "water.je@nivaran.gov", "9000000005", "Dombivli East", "GOV-005", "id.pdf", hash_pw("pass123"), "government", "Desk_Officer", "Municipal Corporation", "Water Works Engineer", "DOM-E-2026", 1, 1, 9, 1),
        
        # Contractors
        ("Contractor Aryan", "build.co@nivaran.gov", "9000000003", "Dombivli East", "GOV-006", "id.pdf", hash_pw("pass123"), "government", "Contractor", "Municipal Corporation", "Road Contractor", "DOM-E-2026", 1, 1, 9, 1),
        ("Contractor Vivek", "light.co@nivaran.gov", "9000000004", "Kalyan", "GOV-007", "id.pdf", hash_pw("pass123"), "government", "Contractor", "Municipal Corporation", "Electrical Contractor", "KAL-W-2026", 1, 1, 9, 1),
        # Contractors for Dombivli East (Will appear in JE Ramesh's Registry)
        ("Aryan Contractor", "aryan@co.in", "9820011001", "Dombivli East", "CON-001", "id.pdf", hash_pw("pass123"), "government", "Contractor", "Municipal Corporation", "Road Specialist", "DOM-E-2026", 1, 1, 9, 1),
        ("Vivek Builders", "vivek@co.in", "9820011002", "Dombivli East", "CON-002", "id.pdf", hash_pw("pass123"), "government", "Contractor", "Municipal Corporation", "Paving Expert", "DOM-E-2026", 1, 1, 9, 1),
        ("Sakshi Chavan", "sakshi@co.in", "9820011003", "Dombivli East", "CON-003", "id.pdf", hash_pw("pass123"), "government", "Contractor", "Municipal Corporation", "Civil Engineer", "DOM-E-2026", 1, 1, 9, 1),
        ("Rahul Sharma", "rahul@co.in", "9820011004", "Dombivli East", "CON-004", "id.pdf", hash_pw("pass123"), "government", "Contractor", "Municipal Corporation", "Drainage Specialist", "DOM-E-2026", 1, 1, 9, 1),
        # Additional Desk Officers for Volume
        ("Officer Meera", "meera@nivaran.gov", "9000000008", "Dombivli East", "GOV-008", "id.pdf", hash_pw("pass123"), "government", "Desk_Officer", "Municipal Corporation", "Junior Engineer", "DOM-E-2026", 1, 1, 9, 1),
        ("Officer Kabir", "kabir@nivaran.gov", "9000000009", "Dombivli East", "GOV-009", "id.pdf", hash_pw("pass123"), "government", "Desk_Officer", "Municipal Corporation", "Junior Engineer", "DOM-E-2026", 1, 1, 9, 1),
        ("Officer Ananya", "ananya@nivaran.gov", "9000000010", "Dombivli East", "GOV-010", "id.pdf", hash_pw("pass123"), "government", "Desk_Officer", "Municipal Corporation", "Junior Engineer", "DOM-E-2026", 1, 1, 9, 1)
    ]

    cursor.executemany('''
        INSERT INTO government_officers (
            name, email, phone, location, uid_number, proof_path, password_hash, role, 
            admin_role, admin_body, specific_role, workspace_code, is_setup, 
            is_setup_complete, onboarding_step, is_onboarded
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', officers)
            
    conn.commit()
    conn.close()
    print("✅ Seeded 10 multi-role officers successfully (Majority in Dombivli East).")

if __name__ == "__main__":
    seed_officers()