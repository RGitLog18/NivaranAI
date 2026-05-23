from fastapi import FastAPI, File, Form, UploadFile, BackgroundTasks, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import sqlite3
import uvicorn
import time
import smtplib
import os
import random
from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url

from detective import run_ai_detection  # AI Verification (Roboflow)
from priortize import prioritize_complaint  # Categorization & Logic
from Clustering import get_clusters  # Clustering Logic
from verification import (
    auth_context, OTPRequest, VerifyRequest, CitizenFinal, 
    init_verification_db, send_email, hash_password
)
from desk_routes import router as desk_router
import status_update
import reglogverify
import onboarding
import hashlib
from email.mime.text import MIMEText

import nltk
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    
# Load environment variables
load_dotenv()

app = FastAPI(title="Nivaran Backend - Enterprise Verified AI Pipeline")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "https://nivaran-lbg3.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app = FastAPI(title="Nivaran Backend - Enterprise Verified AI Pipeline")
app.include_router(status_update.router)
# app.include_router(verification.router)
# app.include_router(priority.router)
# app.include_router(Clustering.router)
app.include_router(reglogverify.router)
app.include_router(onboarding.router)
app.include_router(desk_router)

auth_context = {}
sessions = {} # {token: {"name": str, "role": str}}

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Cloudinary Configuration
cloudinary.config( 
  cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
  api_key = os.getenv("CLOUDINARY_API_KEY"), 
  api_secret = os.getenv("CLOUDINARY_API_SECRET"),
  secure = True
)

# --- 2. SECURITY CONFIGURATION ---
DATABASE_PATH = os.getenv("DATABASE_PATH", "grievance.db")   # Complaints & core data
CITIZEN_DB = os.getenv("CITIZEN_DB_PATH", "citizen.db")          # Citizens, auth, system_config
GOVERNMENT_DB = os.getenv("GOVERNMENT_DB_PATH", "government.db")  # Government officers, auth, system_config
GRIEVANCE_DB = os.getenv("GRIEVANCE_DB_PATH", "grievance.db")    # Complaints, AI results, status
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-government-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
SMTP_EMAIL = "rajeedandge444@gmail.com" 
SMTP_PASSWORD = "zkpm slsj txnh bclm"

# AES-256-GCM Implementation (Sovereign Hardening)
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
ENCRYPTION_KEY_RAW_STR = os.getenv("ENCRYPTION_KEY", "32-bytes-of-sovereign-intelligence-key!")
# Ensure 32 bytes for AES-256
key_bytes = ENCRYPTION_KEY_RAW_STR.encode().ljust(32)[0:32]
aesgcm = AESGCM(key_bytes)

# Password Hashing Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ... inside security configuration section ...
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

# --- ADD THIS LINE TO CREATE THE FOLDER AUTOMATICALLY ---
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# In-memory OTP store
auth_context = {}

# --- MODELS ---
class OTPRequest(BaseModel):
    email: str
    name: str
    role: str
    is_signup: bool

class VerifyRequest(BaseModel):
    email: str
    code: str

class CitizenFinal(BaseModel):
    name: str
    email: str
    phone: str
    uid_number: str
    password: str

#--- Definitions ----
def get_db_connection(db_name):
    conn = sqlite3.connect(db_name)
    conn.row_factory = sqlite3.Row
    return conn

# --- EMAIL HELPER ---
def send_email(target, subject, body):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = SMTP_EMAIL
    msg['To'] = target
    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, [target], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Email Error: {e}")
        return False

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_session(email: str, name: str, role: str):
    token = hashlib.sha256(f"{email}{datetime.now()}".encode()).hexdigest()
    sessions[token] = {"name": name, "role": role}
    return token


def encrypt_data(data: str) -> str:
    """Industrial-Grade AES-256-GCM Encryption"""
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data.encode(), None)
    return (nonce.hex() + ciphertext.hex())

def decrypt_data(data_hex: str) -> str:
    """Industrial-Grade AES-256-GCM Decryption"""
    data_bytes = bytes.fromhex(data_hex)
    nonce = data_bytes[0:12]
    ciphertext = data_bytes[12:len(data_bytes)]
    return aesgcm.decrypt(nonce, ciphertext, None).decode()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception

async def check_admin_authority(current_user: str = Depends(get_current_user)):
    """Strict Backend Provision: Admin Gatekeeping."""
    conn = sqlite3.connect(CITIZEN_DB)
    cursor = conn.cursor()
    # Teammate logic uses 'role' or a specific flag
    cursor.execute("SELECT role FROM government_officers WHERE email = ?", (current_user,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or user[0].lower() not in ['government', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="GOVERNMENT AUTHORITY REQUIRED: Access restricted to Government staff."
        )
    return current_user

def init_db():
    # --- 🚩 New logic added at Line 143 to ensure grievance table exists ---
    with sqlite3.connect(DATABASE_PATH) as conn:
        conn.execute('''
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
        conn.commit()

    # --- MIGRATION: Add admin columns if schema is older ---
    for col, defn in [("admin_email", "TEXT"), ("admin_name", "TEXT")]:
        try:
            # Reusing GOVERNMENT_DB connection for migrations
            with sqlite3.connect(GOVERNMENT_DB) as g_migrate_conn:
                g_migrate_conn.execute(f"ALTER TABLE system_config ADD COLUMN {col} {defn}")
        except Exception:
            pass

    gconn = sqlite3.connect(GOVERNMENT_DB)
    gcursor = gconn.cursor()
    
    # --- MIGRATION: Ensure system_config exists with required schema ---
    gcursor.execute('''
        CREATE TABLE IF NOT EXISTS system_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_email TEXT,
            admin_name TEXT,
            administrative_scope TEXT,
            sla_hours INTEGER DEFAULT 24,
            desk_officers INTEGER DEFAULT 5,
            field_workers INTEGER DEFAULT 20,
            category_mapping TEXT DEFAULT '{}'
        )
    ''')

    # Persistent Auth Context: Thread-Safe SQLite Storage for OTPs
    gcursor.execute('''
        CREATE TABLE IF NOT EXISTS auth_otps (
            email TEXT PRIMARY KEY,
            code TEXT,
            expiry TEXT,
            sent_at TEXT,
            verified INTEGER DEFAULT 0,
            role TEXT
        )
    ''')
    gcursor.execute('''
        CREATE TABLE IF NOT EXISTS government_officers (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT, email TEXT UNIQUE, phone TEXT, 
            location TEXT, uid_number TEXT, password_hash TEXT, 
            role TEXT, admin_role TEXT, admin_body TEXT, 
            specific_role TEXT, workspace_code TEXT, admin_domain TEXT,
            is_setup_complete INTEGER DEFAULT 0, onboarding_step INTEGER DEFAULT 1,
            is_onboarded INTEGER DEFAULT 0
        )
    ''')
    # --- MIGRATION: Ensure all columns exist in government_officers ---
    cols = [
        ("admin_role", "TEXT DEFAULT 'Desk_Officer'"),
        ("admin_body", "TEXT"),
        ("specific_role", "TEXT"),
        ("workspace_code", "TEXT"),
        ("admin_domain", "TEXT"),
        ("is_setup_complete", "INTEGER DEFAULT 0"),
        ("onboarding_step", "INTEGER DEFAULT 1"),
        ("is_onboarded", "INTEGER DEFAULT 0")
    ]
    for col, defn in cols:
        try:
            gcursor.execute(f"ALTER TABLE government_officers ADD COLUMN {col} {defn}")
        except Exception:
            pass
    
    gcursor.execute("PRAGMA journal_mode=WAL")
    gconn.commit()
    gcursor.execute('''
    CREATE TABLE IF NOT EXISTS citizens (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    email TEXT UNIQUE, 
    phone TEXT,   
    uid_number TEXT,     
    password_hash TEXT, 
    role TEXT DEFAULT 'citizen'
);
''')
    

    # Performance Crack: Authentication Indexing for sub-50ms query speed
    gcursor.execute('CREATE INDEX IF NOT EXISTS idx_citizens_email ON citizens(email)')
    gcursor.execute('CREATE INDEX IF NOT EXISTS idx_government_officers_email ON government_officers(email)')
    gcursor.execute("PRAGMA journal_mode=WAL")
    gconn.commit()
    gconn.close()

init_db()
# --- AUTH APIS (Signup & Login) ---

@app.post("/api/citizen/send-otp")
async def citizen_send_otp(data: OTPRequest):
    email = data.email.strip().lower()
    is_signup = data.is_signup

    # --- LOGGING TRIGGER ---
    print("\n" + "!"*60, flush=True)
    print(f"DEBUG: CITIZEN REQUEST RECEIVED FOR: {email}", flush=True)
    
    # Database: citizen.db | Table: citizens
    with sqlite3.connect('./citizen.db') as conn:
        cursor = conn.cursor()
        # For citizens, we check if the email exists
        user = cursor.execute(
            "SELECT email FROM citizens WHERE email = ?", 
            (email,)
        ).fetchone()

    # LOGIN CHECK: Citizen must have an account
    if not is_signup and not user:
        raise HTTPException(status_code=404, detail="Citizen account not found. Please sign up.")

    # SIGNUP CHECK: Prevent duplicate citizen accounts
    if is_signup and user:
        raise HTTPException(status_code=400, detail="Citizen email already registered. Please login.")

    # Generate OTP and store in shared auth_context
    otp_code = str(random.randint(100000, 999999))
    auth_context[email] = {
        "code": otp_code,
        "expiry": datetime.now() + timedelta(minutes=10),
        "verified": False,
        "role": "citizen",
        "name": data.name,
        "is_signup": is_signup
    }

    print(f"👤 CITIZEN OTP for {email}: {otp_code}")
    send_email(email, "Citizen Portal Verification", f"Your Nivaran verification code is: {otp_code}")
    
    return {"status": "success", "message": "OTP sent successfully."}

@app.post("/api/citizen/verify-otp")
async def citizen_verify_otp(data: VerifyRequest):
    email = data.email.strip().lower()
    record = auth_context.get(email)

    if not record:
        raise HTTPException(status_code=404, detail="OTP session expired or not found")

    if record["code"] != data.code:
        raise HTTPException(status_code=400, detail="Invalid Handshake Code.")

    # Mark as verified in memory
    record["verified"] = True
    is_signup = record.get("is_signup", False)

    # --- CASE 1: LOGIN FLOW ---
    if not is_signup:
        # Database: citizen.db | Table: citizens
        with sqlite3.connect(CITIZEN_DB) as conn:
            conn.row_factory = sqlite3.Row
            user = conn.execute(
                "SELECT * FROM citizens WHERE email = ?", 
                (email,)
            ).fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="Citizen records missing. Please sign up.")
        
        user_dict = dict(user)
        token = generate_session(user_dict["email"], user_dict["name"], "citizen")

        # Citizens always go to the main citizen dashboard
        return {
            "status": "success",
            "token": token,
            "user": {
                "name": user_dict["name"],
                "email": user_dict["email"],
                "phone": user_dict["phone"],
                "role": "citizen",
                "is_setup_complete": 1
            },
            "redirect_to": "/citizen"
        }

    # --- CASE 2: SIGNUP FLOW ---
    token = generate_session(email, record.get("name", "New Citizen"), "citizen")
    return {
        "status": "success", 
        "token": token,
        "message": "Citizen Identity Verified. Complete your profile."
    }

@app.post("/api/citizen/register")
async def register_citizen(data: CitizenFinal):
    if not auth_context.get(data.email, {}).get("verified"):
        raise HTTPException(status_code=403, detail="Please verify your email first.")
    
    conn = sqlite3.connect(CITIZEN_DB)
    try:
        conn.execute("INSERT INTO citizens (name, email, phone, uid_number, password_hash) VALUES (?, ?, ?, ?, ?)",
            (data.name, data.email, data.phone, data.uid_number, hash_password(data.password)))
        conn.commit()
        
        token = generate_session(data.email, data.name, "citizen")
        if data.email in auth_context: del auth_context[data.email]
        
        return {"status": "success", "token": token}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="User already exists.")
    finally: 
        conn.close()
        
# --- COMPLAINT SUBMISSION PIPELINE ---

 #--- 1. THE AI PIPELINE (Background Task) ---
async def run_ai_pipeline(complaint_id, file_path, description, lat, lon, location_text):
    """Background Task: YOLOv11 Scan + NLP Prioritization."""
    try:
        from detective import run_ai_detection
        from priortize import prioritize_complaint
        
        # 1. Image Verification (YOLOv11)
        ai_result = run_ai_detection(file_path)
        
        # 2. Triage & Priority (NLP + Geospatial)
        logic = prioritize_complaint(description, ai_result, lat, lon, location_text)
        
        # 3. Update Status
        status = "verified" if ai_result['detected'] else "rejected"
        
        conn = sqlite3.connect(GRIEVANCE_DB)
        conn.execute('''
            UPDATE complaints 
            SET status=?, priority=?, ai_category=?, ai_score=?, verified_at=CURRENT_TIMESTAMP
            WHERE id=?
        ''', (status, logic['priority'], logic['ai_category'], logic['ai_score'], complaint_id))
        conn.commit()
        conn.close()
        print(f"✅ AI Pipeline complete for ID: {complaint_id}")
    except Exception as e:
        print(f"❌ AI Pipeline Error: {e}")

@app.post("/api/citizen/submit-complaint")
async def submit_complaint(
    background_tasks: BackgroundTasks,
    full_name: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...), # Added for OTP verification
    language: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    latitude: float = Form(0.0),
    longitude: float = Form(0.0),
    ward_zone: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Revolutionary Developer Entry Point:
    Validates OTP verification status before triggering AI scan.
    """
    # --- FAIL-FAST DUPLICATE DETECTION (10m Radius) ---
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    # Using a simple bounding box for 10m approximately (0.0001 degrees)
    # cursor.execute("""
    #     SELECT id FROM complaints 
    #     WHERE status IN ('pending', 'verified', 'assigned') 
    #     AND ABS(latitude - ?) < 0.0001 
    #     AND ABS(longitude - ?) < 0.0001
    #     LIMIT 1
    # """, (latitude, longitude))
    # duplicate = cursor.fetchone()
    # if duplicate:
    #     conn.close()
    #     raise HTTPException(
    #         status_code=400,
    #         detail="Hotspot Detected: Our team is already on-site at this location (Case ID: " + str(duplicate[0]) + ")."
    #     )
    conn.close()

    # STRICT Conflict Resolution: Verify OTP Identity Layer first
    email_clean = email.lower().strip()
    with sqlite3.connect(CITIZEN_DB) as ident_conn:
        user = ident_conn.execute("SELECT email FROM citizens WHERE email = ?", (email_clean,)).fetchone()
    
    if not user:
        # Fallback to temporary memory if not fully registered
        verification_record = auth_context.get(email_clean)
        if not verification_record or not verification_record.get("verified"):
            raise HTTPException(status_code=403, detail="Identity not verified. Please verify OTP.")

    try:
         # --- NEW CLOUDINARY UPLOAD LOGIC ---
        # Read the file bytes
        file_content = await file.read()
        
        # Upload to Cloudinary directly from memory
        upload_result = cloudinary.uploader.upload(
            file_content,
            folder="nivaran_complaints"
        )
        
        # Get the Secure URL (https)
        image_url = upload_result.get("secure_url")
        ai_result = run_ai_detection(image_url)

        if not ai_result['detected'] or ai_result['confidence'] < 0.5:
            # OPTIONAL: Delete from Cloudinary if AI rejects it to save space
            # public_id = upload_result['public_id']
            # cloudinary.uploader.destroy(public_id)
            
            raise HTTPException(
                status_code=400, 
                detail=f"AI REJECTED: Image is not a valid grievance ({ai_result['label']})."
            )

        # --- DATABASE LOGIC ---
        encrypted_name = encrypt_data(full_name)
        encrypted_phone = encrypt_data(phone)

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO complaints (
                full_name, phone, email, language,
                description, location, latitude, longitude, ward_zone, image_path, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                encrypted_name, encrypted_phone, email, language,
                description, location, latitude, longitude, ward_zone, 
                image_url, # <--- Save the Cloudinary URL here instead of local path
                'verified'
            )
        )
        complaint_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Trigger background AI task using the URL or the content
        background_tasks.add_task(run_ai_pipeline, complaint_id, image_url, description, latitude, longitude, location)
        
        return {
            "status": "success",
            "id": complaint_id,
            "image_url": image_url,
            "message": "Verified! Complaint received and image stored in cloud."
        }

    except Exception as e:
        print(f"Server Error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/api/v1/admin/executive-summary")
async def get_executive_summary(
    ward: str, 
    period: str = "daily", 
    current_user: str = Depends(get_current_user)
):
    """
    Sovereign Analytics Engine: 
    Calculates statistics based on the specified Ward and Time Period.
    """
    try:
        # Define Time Filter logic for SQLite
        if period == "daily":
            time_filter = "AND strftime('%Y-%m-%d', created_at) = strftime('%Y-%m-%d', 'now')"
        elif period == "weekly":
            time_filter = "AND created_at >= date('now', '-7 days')"
        else: # yearly
            time_filter = "AND created_at >= date('now', '-1 year')"

        with sqlite3.connect(DATABASE_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # 1. Fetch Status Counts (Total, Pending, Resolved, Rejected)
            # We group by status to get counts for the charts
            cursor.execute(f'''
                SELECT status, COUNT(*) as count 
                FROM complaints 
                WHERE ward_zone = ? {time_filter}
                GROUP BY status
            ''', (ward,))
            
            status_rows = cursor.fetchall()
            status_data = {row['status']: row['count'] for row in status_rows}
            
            # Logic: Calculate standard metrics for the cards
            # We sum 'pending', 'verified', and 'assigned' as "Pending" for the UI
            pending_count = (status_data.get('pending', 0) + 
                             status_data.get('verified', 0) + 
                             status_data.get('assigned', 0))
            
            resolved_count = status_data.get('resolved', 0)
            rejected_count = status_data.get('rejected', 0)
            total_count = pending_count + resolved_count + rejected_count

            return {
                "summary": {
                    "total": total_count,
                    "pending": pending_count,
                    "resolved": resolved_count,
                    "rejected": rejected_count
                },
                "period": period,
                "ward": ward
            }
    except Exception as e:
        print(f"❌ Analytics Crash: {e}")
        raise HTTPException(status_code=500, detail="Operational Analytics Offline")

    
@app.get("/api/v1/user/profile")
async def get_user_profile(current_user: str = Depends(get_current_user)):
    conn = sqlite3.connect(GOVERNMENT_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        # Use exact names: phone, uid_number, location, admin_role, admin_domain
        user = cursor.execute(
            "SELECT name, email, phone, uid_number, location,  admin_role, admin_domain, is_setup_complete FROM government_officers WHERE email = ?", 
            (current_user.lower(),)
        ).fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="Identity not found")
        
        u = dict(user)
        return {
            "name": u["name"],
            "email": u["email"],
            "phone": u["phone"],
            "uid_number": u["uid_number"],
            "ward": u["location"], 
            "location": u["location"],
            "latitude": u["latitude"],
            "longitude": u["longitude"],
            "admin_role": u["admin_role"],
            "admin_domain": u["admin_domain"],
            "is_setup_complete": u["is_setup_complete"],
            "role": "government"
        }
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    # Init DBs
    c_conn = sqlite3.connect(CITIZEN_DB)
    c_conn.execute('CREATE TABLE IF NOT EXISTS citizens (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, phone TEXT, uid_number TEXT, password_hash TEXT)')
    c_conn.close()
    
    g_conn = sqlite3.connect(GRIEVANCE_DB)
    g_conn.execute('CREATE TABLE IF NOT EXISTS complaints (id INTEGER PRIMARY KEY, full_name TEXT, phone TEXT, email TEXT, language TEXT, text_desc TEXT, location TEXT, ward_zone TEXT, latitude REAL, longitude REAL, image_path TEXT, status TEXT, priority TEXT, ai_category TEXT, ai_score REAL)')
    g_conn.close()
    
    uvicorn.run(app, host="0.0.0.0", port=8000)