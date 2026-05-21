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

def seed_com():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    

    categories = ["Roads & Infrastructure", "Sanitation & Waste", "Water Supply", "Electricity"]
    priorities = ["Dangerous", "Moderate", "Low"]
    statuses = ["pending", "verified", "assigned", "resolved"]
    
    # Base location from your screenshot
    base_lat = 19.2054
    base_lon = 73.0956

    print(f"🚀 Seeding 50 complaints for Manpada Road neighborhood...")

    for i in range(1, 51):
        # Edge Case: Create a high-density cluster for the first 15 (Hotspot Test)
        if i <= 15:
            lat = base_lat + random.uniform(-0.0002, 0.0002)
            lon = base_lon + random.uniform(-0.0002, 0.0002)
            cat = "Roads & Infrastructure" # Group them in one category
            prio = "Dangerous"
            score = random.uniform(8.5, 9.9)
        else:
            # Spread others around the general area
            lat = base_lat + random.uniform(-0.01, 0.01)
            lon = base_lon + random.uniform(-0.01, 0.01)
            cat = random.choice(categories)
            prio = random.choice(priorities)
            score = random.uniform(2.0, 8.4)

        status = random.choice(statuses)
        
        # Attributes matching your standardized takeimage.py schema
        complaint = (
            encrypt(f"Citizen Name {i}"), # full_name
            encrypt(f"9821630{i:03d}"),   # phone
            f"citizen{i}@nivaran.in",      # email
            "English",                    # language
            f"Issue #{i}: Reported {cat} problem at Manpada location.", # description
            "Manpada Road, Dombivli East",# location
            "Dombivli East",              # ward_zone
            lat,                          # latitude
            lon,                          # longitude
            "uploads/demo_pothole.jpg",   # image_path
            status,                       # status
            prio,                         # priority
            cat,                          # ai_category
            round(score, 1)               # ai_score
        )

        cursor.execute('''
            INSERT INTO complaints (
                full_name, phone, email, language, description, location, 
                ward_zone, latitude, longitude, image_path, status, 
                priority, ai_category, ai_score
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)''', complaint)

    conn.commit()
    conn.close()
    print(f"✅ SUCCESS: 50 Complaints with Encrypted PII and Cluster Data added to {DB_PATH}")

if __name__ == "__main__":
    seed_com()