import os
import sqlite3
import requests
import tempfile
from roboflow import Roboflow
from dotenv import load_dotenv
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

load_dotenv()

# --- 1. AI CONFIGURATION ---
API_KEY = os.getenv("ROBOFLOW_API_KEY")
rf = Roboflow(api_key=API_KEY)
project = rf.workspace().project(os.getenv("ROBOFLOW_PROJECT"))
model = project.version(int(os.getenv("ROBOFLOW_VERSION", 1))).model

# --- 2. SECURITY SYNC: AES-256-GCM ---
ENCRYPTION_KEY_RAW = os.getenv("ENCRYPTION_KEY", "32-bytes-of-sovereign-intelligence-key!")
key_bytes = ENCRYPTION_KEY_RAW.encode().ljust(32)[0:32]
aesgcm = AESGCM(key_bytes)

VALID_GRIEVANCES = [
    "pothole", "potholes", "pot-hole", "road-issue", "pothole-detection",
    "garbage", "waste", "trash", "dump", "litter",
    "sewage", "water-leak", "overflow",
    "street_light", "light-issue", "broken-lamp"
]

# --- 3. THE MISSING FUNCTION: DECRYPT DATA ---
def decrypt_data(data_hex: str) -> str:
    """Standardized GCM Decryption to match main server"""
    try:
        data_bytes = bytes.fromhex(data_hex)
        nonce = data_bytes[0:12]
        ciphertext = data_bytes[12:]
        return aesgcm.decrypt(nonce, ciphertext, None).decode()
    except Exception:
        return data_hex # Fallback for unencrypted seed data

# --- 4. THE AI DETECTION FUNCTION ---
def run_ai_detection(image_source):
    """
    Downloads Cloudinary URL to a temporary local file, 
    runs AI, and cleans up.
    """
    tmp_path = None
    try:
        # Handle URL vs Local Path
        if image_source.startswith("http"):
            print(f"Downloading image for AI scan: {image_source}")
            response = requests.get(image_source, timeout=10)
            if response.status_code != 200:
                return {"detected": False, "label": "download_error", "confidence": 0.0}

            # Create a temporary file
            suffix = ".jpg"
            if ".png" in image_source.lower(): suffix = ".png"
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(response.content)
                tmp_path = tmp.name 
        else:
            tmp_path = image_source

        # Trigger Prediction
        prediction = model.predict(tmp_path, confidence=60).json()
        detections = prediction.get('predictions', [])

        print(f"\n--- RAW AI SCAN RESULTS ---")
        best_valid_detection = None
        for d in detections:
            label = d['class'].lower().strip()
            print(f" > Found: {label} ({d['confidence']:.2f})")
            if label in VALID_GRIEVANCES:
                best_valid_detection = d
                break 

        # Cleanup
        if image_source.startswith("http") and tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

        if best_valid_detection:
            return {
                "detected": True,
                "label": best_valid_detection['class'], 
                "confidence": best_valid_detection['confidence']
            }
        
        return {"detected": False, "label": "invalid_object", "confidence": 0.0}

    except Exception as e:
        if tmp_path and os.path.exists(tmp_path):
            try: os.remove(tmp_path)
            except: pass
        print(f"⚠️ AI VISION CRASH: {str(e)}")
        return {"detected": False, "label": "error", "confidence": 0.0}