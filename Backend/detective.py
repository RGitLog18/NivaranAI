import os
import sqlite3
from roboflow import Roboflow
from dotenv import load_dotenv
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

load_dotenv()

# --- AI CONFIGURATION ---
API_KEY = os.getenv("ROBOFLOW_API_KEY")
rf = Roboflow(api_key=API_KEY)
project = rf.workspace().project(os.getenv("ROBOFLOW_PROJECT"))
model = project.version(int(os.getenv("ROBOFLOW_VERSION", 1))).model

# --- SECURITY SYNC: AES-256-GCM ---
ENCRYPTION_KEY_RAW = os.getenv("ENCRYPTION_KEY", "32-bytes-of-sovereign-intelligence-key!")
key_bytes = ENCRYPTION_KEY_RAW.encode().ljust(32)[0:32]
aesgcm = AESGCM(key_bytes)

VALID_GRIEVANCES = [
    "pothole", "potholes", "pot-hole", "road-issue", "pothole-detection",
    "garbage", "waste", "trash", "dump", "litter",
    "sewage", "water-leak", "overflow",
    "street_light", "light-issue", "broken-lamp"
]
def decrypt_data(data_hex: str) -> str:
    """Standardized GCM Decryption to match takeimage.py"""
    try:
        data_bytes = bytes.fromhex(data_hex)
        nonce = data_bytes[0:12]
        ciphertext = data_bytes[12:]
        return aesgcm.decrypt(nonce, ciphertext, None).decode()
    except Exception:
        return data_hex # Fallback for unencrypted seed data

def run_ai_detection(image_path):
    """
    Visual Verification Pipeline: 
    Scans image, logs all guesses, and verifies against Grievance Whitelist.
    """
    try:
        # 1. Trigger Model Prediction
        prediction = model.predict(image_path, confidence=60).json()
        detections = prediction.get('predictions', [])

        # 2. DEBUG LOGGING: Prints every object the AI sees
        print(f"\n--- RAW AI SCAN RESULTS: {os.path.basename(image_path)} ---")
        if not detections:
            print("Status: Blank Image (No objects found above 60%)")
        else:
            for d in detections:
                print(f" > Label: {d['class']} | Confidence: {d['confidence']:.2f}")

        # 3. IF NO OBJECTS FOUND: Reject immediately
        if not detections:
            return {"detected": False, "label": "none", "confidence": 0.0}

        # 4. WHITELIST FILTERING: Look for a match in VALID_GRIEVANCES
        best_valid_detection = None
        for d in detections:
            label = d['class'].lower().strip()
            
            # Check if this specific label is in our allowed list
            if label in VALID_GRIEVANCES:
                best_valid_detection = d
                break  # Stop at the highest confidence valid match

        # 5. FINAL DECISION
        if best_valid_detection:
            print(f"✅ VERIFIED: Found valid grievance '{best_valid_detection['class']}'")
            return {
                "detected": True,
                "label": best_valid_detection['class'], 
                "confidence": best_valid_detection['confidence']
            }
        
        # If the AI found things, but they aren't on the grievance list (e.g., a car, a dog)
        print(f"❌ REJECTED: Objects found, but none are in Whitelist.")
        return {"detected": False, "label": "invalid_object", "confidence": 0.0}

    except Exception as e:
        # 🚩 THE FIX: Handling errors so the server doesn't crash
        print(f"⚠️ AI VISION CRASH: {str(e)}")
        return {"detected": False, "label": "error", "confidence": 0.0}