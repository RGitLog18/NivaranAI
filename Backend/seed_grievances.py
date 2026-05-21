import sqlite3
import os
import random
from datetime import datetime, timedelta
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv

load_dotenv()

# --- CONFIG ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "grievance.db")

# Standard Encryption Key (Must match your .env)
ENCRYPTION_KEY_RAW = os.getenv("ENCRYPTION_KEY", "32-bytes-of-sovereign-intelligence-key!")
key_bytes = ENCRYPTION_KEY_RAW.encode().ljust(32)[0:32]
aesgcm = AESGCM(key_bytes)

def encrypt(data: str) -> str:
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, str(data).encode(), None)
    return (nonce.hex() + ciphertext.hex())

def seed_grievances():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT,
            phone TEXT, 
            email TEXT,
            language TEXT,
            description TEXT,
            location TEXT,
            ward_zone TEXT,
            latitude REAL,
            longitude REAL,
            image_path TEXT,
            status TEXT DEFAULT 'pending',
            priority TEXT,
            ai_category TEXT,
            ai_score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            verified_at TIMESTAMP,
            assigned_at TIMESTAMP,
            deadline_at TIMESTAMP,
            resolved_at TIMESTAMP,
            resolution_image_path TEXT,
            contractor_id TEXT
        )
    ''')

    categories = ["Roads & Infrastructure", "Sanitation & Waste", "Water Supply", "Electricity"]
    priorities = ["Dangerous", "Moderate", "Low"]
    statuses = ["pending", "verified", "assigned", "resolved"]
    
    target_contractor = "sakshi@co.in"
    fixed_assigned_time = "2026-04-15 04:16:26"
    fixed_resolved_time = "2026-04-15 10:30:00"

    # Base location from your screenshot
    base_lat = 19.0330 
    base_lon = 73.0130

    print(f"🚀 Seeding 50 complaints for Manpada Road neighborhood...")

    for i in range(1, 51):
        # Edge Case: Create a high-density cluster for the first 15 (Hotspot Test)
        if i <= 15:
            lat = base_lat + random.uniform(-0.0003, 0.0003)
            lon = base_lon + random.uniform(-0.0003, 0.0003)
            cat = "Roads & Infrastructure" # Group them in one category
            prio = "Dangerous"
            score = random.uniform(8.5, 9.9)
        else:
            # Spread others around the general area
            lat = base_lat + random.uniform(-0.008, 0.008)
            lon = base_lon + random.uniform(-0.008, 0.008)
            cat = random.choice(categories)
            prio = random.choice(priorities)
            score = random.uniform(2.0, 8.4)

        # Logic for status distribution: 60% Resolved, 40% Assigned
        status = "resolved" if random.random() > 0.4 else "assigned"
        
        
        # Attributes matching your standardized takeimage.py schema
        complaint = (
            encrypt(f"Citizen Name {i}"), # full_name
            encrypt(f"9821630{i:03d}"),   # phone
            f"citizen{i}@nivaran.in",      # email
            "English",                    # language
            f"Issue #{i}: Reported {cat} problem in Nerul West sector area.", # description
            "Sector 15, Nerul West, Navi Mumbai", # location 
            "Nerul West",              # ward_zone
            lat,                          # latitude
            lon,                          # longitude
            "uploads/khada.jpg",   # image_path
            status,                       # status
            prio,                         # priority
            cat,                          # ai_category
            round(score, 1),            # ai_score
            target_contractor,            # contractor_id
            fixed_assigned_time,          # assigned_at
            fixed_resolved_time if status == "resolved" else None # resolved_at
        )

        cursor.execute('''
            INSERT INTO complaints (
                full_name, phone, email, language, description, location, 
                ward_zone, latitude, longitude, image_path, status, 
                priority, ai_category, ai_score,contractor_id, assigned_at, resolved_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''', complaint)

    conn.commit()
    conn.close()
    print(f"✅ SUCCESS: 50 Complaints with Encrypted PII and Cluster Data added to {DB_PATH}")

if __name__ == "__main__":
    seed_grievances()