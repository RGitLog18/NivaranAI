from fastapi import APIRouter, HTTPException, Form, Depends, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import random
import smtplib
import hashlib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from fastapi import BackgroundTasks
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["Authentication"])

# --- CONFIG ---
GOVERNMENT_DB = os.getenv("GOVERNMENT_DB_PATH", "government.db")
CITIZEN_DB = os.getenv("CITIZEN_DB_PATH", "citizen.db")
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-government-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440
SMTP_EMAIL = "rajeedandge444@gmail.com" 
SMTP_PASSWORD = "zkpm slsj txnh bclm"

# In-memory store for OTPs and Sessions
auth_context = {}
sessions = {} # {token: {"name": str, "role": str}}

# --- DB HELPERS ---
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

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

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# def send_email(target, subject, body):
#     from email.mime.multipart import MIMEMultipart
#     msg = MIMEMultipart()
#     msg['Subject'] = subject
#     msg['From'] = SMTP_EMAIL
#     msg['To'] = target
#     msg.attach(MIMEText(body, 'plain'))
#     try:
#         server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30)
#         server.login(SMTP_EMAIL, SMTP_PASSWORD)
#         server.send_message(msg)
#         server.quit()
#         return True
#     except Exception as e:
#         print(f"Nivaran Mail Engine Error: {e}")
#         return False


# --- MODELS ---
class OTPRequest(BaseModel):
    email: str
    name: str
    role: str
    is_signup: bool

class VerifyRequest(BaseModel):
    email: str
    code: str

def init_db():
        # 1. Initialize Citizen Database
    try:
        conn_c = sqlite3.connect(CITIZEN_DB)
        cursor_c = conn_c.cursor()
        cursor_c.execute('''CREATE TABLE IF NOT EXISTS citizens (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT, 
            email TEXT UNIQUE, 
            phone TEXT, 
            uid_number TEXT, 
            password_hash TEXT, 
            role TEXT DEFAULT 'citizen')''')
        conn_c.commit()
        conn_c.close()
        print("✅ Citizen Database Initialized")
    except Exception as e:
        print(f"❌ Error initializing Citizen DB: {e}")
    
    try:
        conn_g = sqlite3.connect(GOVERNMENT_DB)
        cursor_g = conn_g.cursor()

        
        # Permanent Table
        cursor_g.execute('''CREATE TABLE IF NOT EXISTS government_officers (
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
        
        
        # Onboarding Progress Table
        cursor_g.execute('''CREATE TABLE IF NOT EXISTS onboarding_progress (
            email TEXT PRIMARY KEY,
            step INTEGER DEFAULT 1,
            name TEXT,
            phone TEXT,
            location TEXT,
            uid_number TEXT,
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

        # Add this inside your init_dbs() function under the Government section
        cursor_g.execute('''CREATE TABLE IF NOT EXISTS workspaces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT,
            workspace_code TEXT UNIQUE,
            admin_body TEXT,
            is_active INTEGER DEFAULT 1
        )''')

        # Optional: Seed a test workspace
        cursor_g.execute("INSERT OR IGNORE INTO workspaces (location, workspace_code, admin_body) VALUES ('Mumbai', 'MUM789', 'Municipal Corporation')")

        conn_g.commit()
        conn_g.close()
        print("✅ Government Database Initialized")
    except Exception as e:
        print(f"❌ Error initializing Government DB: {e}")


init_db()
# --- APIS ---

# @app.get("/api/onboarding/status")
# async def get_onboarding_status(email: str):
#     conn = sqlite3.connect(GOVERNMENT_DB)
#     conn.row_factory = sqlite3.Row 
#     cursor = conn.cursor()
#     try:
#         # FIRST: Check if they are already fully registered
#         officer = cursor.execute(
#             "SELECT is_setup_complete FROM government_officers WHERE email = ?", 
#             (email,)
#         ).fetchone()
        
#         if officer and officer["is_setup_complete"] == 1:
#             return {"step": 11, "is_complete": True, "redirect": "/dashboard"}

#         # SECOND: Check temporary progress
#         row = cursor.execute("SELECT * FROM onboarding_progress WHERE email = ?", (email,)).fetchone()
#         if row:
#             res = dict(row)
#             # Logic: If step is > 1, we can skip the OTP screen on refresh
#             res["skip_otp"] = res.get("step", 1) > 1
#             res["is_complete"] = False
#             return res
            
#         # THIRD: Default for brand new users
#         return {"step": 1, "skip_otp": False, "is_complete": False}
        
#     except Exception as e:
#         print(f"❌ Error in status check: {e}")
#         return {"step": 1, "error": str(e)}
#     finally:
#         conn.close()

async def request_otp(email: str = Form(...), name: str = Form(...)):
    # Check if they are ALREADY fully registered
    conn = sqlite3.connect(GOVERNMENT_DB)
    user = conn.execute("SELECT * FROM government_officers WHERE email = ? AND is_setup_complete = 1", (email,)).fetchone()
    conn.close()
    
    if user:
        raise HTTPException(status_code=400, detail="Officer already registered. Please Sign In.")

    otp = str(random.randint(100000, 999999))
    auth_context[email] = {"otp": otp, "name": name, "timestamp": datetime.now()}
    
    # Send email logic here...
    print(f"OTP for {email}: {otp}") 
    return {"status": "success", "message": "OTP Dispatched"}

@router.post("/api/gov/send-otp")
async def send_otp(data: OTPRequest, background_tasks: BackgroundTasks):
    email = data.email.strip().lower()
    is_signup = data.is_signup

    # Database: government.db | Table: government_officers
    with sqlite3.connect(GOVERNMENT_DB) as conn:
        cursor = conn.cursor()
        # Check if the official exists and their onboarding status
        user = cursor.execute(
            "SELECT is_onboarded FROM government_officers WHERE email = ?", 
            (email,)
        ).fetchone()

    # LOGIN CHECK: Official must already exist in DB
    if not is_signup and not user:
        # Changed 404 to 401 to distinguish from a "Page Not Found" error
        raise HTTPException(status_code=401, detail="No official account found with this email. Please register.")
        
    # SIGNUP CHECK: Prevent duplicate registration if already onboarded (is_onboarded = 1)
    if is_signup and user and user[0] == 1:
        raise HTTPException(status_code=400, detail="Official already registered. Please login.")

    # Generate OTP and store in shared auth_context
    otp_code = str(random.randint(100000, 999999))
    auth_context[email] = {
        "code": otp_code,
        "expiry": datetime.now() + timedelta(minutes=10),
        "verified": False,
        "role": "government",
        "name": data.name,
        "is_signup": is_signup
    }

    print(f"🏛️ GOV OTP for {email}: {otp_code}")
    background_tasks.add_task(send_email_task, email, "Gov Portal Verification", f"Your Nivaran official code is: {otp_code}")
    
    return {"status": "success", "message": "OTP dispatched to official email."}

# async def verify_otp(data: VerifyRequest):
#     """Teammate's Stable OTP Verification Logic with Admin Moulding"""
#     email = data.email.strip().lower()
#     record = auth_context.get(email)
    
#     if not record or datetime.now() > record["expiry"]:
#         raise HTTPException(status_code=400, detail="OTP expired or not requested.")
    
#     if record["code"] != data.code:
#         raise HTTPException(status_code=400, detail="Invalid code.")
    
#     record["verified"] = True
    
#     # Administrative Moulding: Check government.db for officer status
#     conn = sqlite3.connect(GOVT_DB)  # government.db holds officers & system_config
#     config_exists = conn.execute("SELECT 1 FROM system_config LIMIT 1").fetchone()
    
#     admin_role = "Desk_Officer"
#     location = "General"
#     is_setup_complete = 1  
#     onboarding_step = 9 # Default for non-govt or fully onboarded
    
#     if record["role"] == "government":
#         user_data = conn.execute(
#             "SELECT admin_role, location, onboarding_step, is_onboarded FROM government_officers WHERE email = ?", 
#             (data.email.lower(),)
#         ).fetchone()
#         if user_data:
#             admin_role = user_data[0]
#             location = user_data[1]
#             onboarding_step = user_data[2] or 1
#             is_setup_complete = user_data[3] or 0 # Mapped is_onboarded to setup state
#     conn.close()

#     # Simple Token Generation
#     access_token = create_access_token(
#         data={"sub": data.email, "role": record["role"], "admin_role": admin_role},
#         expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     )
    
#     return {
#         "status": "success", 
#         "token": access_token,
#         "token_type": "bearer",
#         "role": record["role"], 
#         "admin_role": admin_role,
#         "ward": location,
#         "onboarding_step": onboarding_step if record["role"] == "government" else 9,
#         "is_setup_complete": is_setup_complete,
#         "message": "Protocol Authorized"
#     }
@router.post("/api/gov/initial-signup")
async def initial_signup(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...)
):
    """Stage 1: Create basic account and set step to 1."""
    email = email.strip().lower()
    conn = sqlite3.connect(GOVERNMENT_DB)
    try:
        # Check if user exists
        existing = conn.execute("SELECT id FROM government_officers WHERE email = ?", (email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered.")

        # ✅ FIXED: Force onboarding_step to 1 and is_onboarded to 0
        conn.execute(
            """INSERT INTO government_officers (name, email, password_hash, onboarding_step, is_onboarded, is_setup_complete) 
               VALUES (?, ?, ?, 1, 0, 0)""",
            (name, email, hash_password(password))
        )
        conn.commit()
        return {"status": "success", "message": "Stage 1 Complete. Proceed to Onboarding."}
    finally:
        conn.close()
        
@router.post("/api/gov/register/government")
async def register_government(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    location: str = Form(...), # Automated administrative resolution string
    uid_number: str = Form(...),
    password: str = Form(...),
    admin_body: str = Form(...),
    specific_role: str = Form(...),
    workspace_code: Optional[str] = Form(None),
    admin_domain: Optional[str] = Form(None),
    admin_role: str = Form(None), # Default to Desk_Officer
    proof: Optional[UploadFile] = Form(None)  # Optional — can be submitted later
):
    """Revolutionary Developer: Secure Government Officer Registration (Stage 9 Completion)"""
    email = email.strip().lower()
    if not auth_context.get(email, {}).get("verified"):
        raise HTTPException(status_code=403, detail="STRICT: Email verification required first.")

    # Save Proof of Employment (Optional — guard for None)
    proof_path = None
    if proof and proof.filename:
        os.makedirs("gov_proofs", exist_ok=True)
        proof_path = f"gov_proofs/{email}_{proof.filename}"
        content = await proof.read()
        with open(proof_path, "wb") as f:
            f.write(content)

    conn = sqlite3.connect(GOVERNMENT_DB)  # Officers live in government.db
    try:
        # SYSTEMS ARCHITECT: Sovereign Identity Handshake (Lead Role Logic)
        officer_count = conn.execute("SELECT COUNT(*) FROM government_officers").fetchone()[0]
        
        # If it's a first-ever official or a Lead Role, assign Admin status
        lead_roles = ['Sarpanch', 'Assistant Commissioner', 'Chief Officer']
        final_admin_role = "Admin" if officer_count == 0 or specific_role in lead_roles else admin_role

        # Update the existing partial record or insert new one
        conn.execute(
            """UPDATE government_officers SET 
            name = ?, phone = ?, uid_number = ?, proof_path = ?, 
            password_hash = ?, admin_role = ?, location = ?, 
            admin_body = ?, specific_role = ?, workspace_code = ?, admin_domain = ?,
            onboarding_step = 10, is_onboarded = 1 
            WHERE email = ?""",
            (name, phone, uid_number, proof_path, hash_password(password), final_admin_role, location, admin_body, specific_role, workspace_code, admin_domain, email)
        )

        conn.commit()
        
        # Cleanup verification context
        if email in auth_context:
            del auth_context[email]
            
        send_email(email, "Welcome Officer", f"Hello {name}, your Nivaran Officer account is created! Role: {specific_role}")
        return {"status": "success", "redirect_to": "/dashboard", "is_setup_complete": 0}
    except Exception as e:
        print(f"Registration Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/api/gov/verify-otp")
async def gov_verify_otp(data: VerifyRequest):
    email = data.email.strip().lower()
    record = auth_context.get(email)

    # 1. Security Check: Validate OTP code
    if not record or record["code"] != data.code:
        raise HTTPException(status_code=400, detail="Invalid or Expired Handshake Code.")

    # Mark as verified in memory
    record["verified"] = True
    is_signup = record.get("is_signup", False)

    conn = sqlite3.connect(GOVERNMENT_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        if is_signup:
            # --- CASE 2: SIGNUP FLOW (Nuclear Reset) ---
            # We ensure the record exists and FORCE it to Stage 1.
            # This wipes any "remnants" from previous failed attempts.
            cursor.execute("INSERT OR IGNORE INTO government_officers (email) VALUES (?)", (email,))
            cursor.execute(
                """UPDATE government_officers 
                   SET name = ?, onboarding_step = 1, is_onboarded = 0, is_setup_complete = 0 
                   WHERE email = ?""",
                (record.get("name", "New Official"), email)
            )
            conn.commit()

        # --- CASE 1 & 2: RE-HYDRATION ---
        # Fetch the official record from the Database (The Source of Truth)
        user_row = cursor.execute("SELECT * FROM government_officers WHERE email = ?", (email,)).fetchone()
        
        if not user_row:
            raise HTTPException(status_code=404, detail="Official Identity not found in ledger.")

        u = dict(user_row)
        
        # 2. Token Generation
        # Use 'token' (variable name inside this function)
        token = create_access_token(data={"sub": u["email"]})

        # 3. Secure Return: Explicitly tell the UI where the user stands
        return {
            "status": "success",
            "token": token,
            "user": {
                "email": u["email"],
                "name": u["name"],
                "admin_role": u.get("admin_role") or "Desk_Officer",
                "location": u.get("location") ,
                "ward": u.get("location"),
                "latitude": u.get("latitude"),  # Placeholder for future geospatial features
                "longitude": u.get("longitude"), # Placeholder for future geospatial features
                "is_setup_complete": u.get("is_setup_complete", 0), # FROM DB
                "onboarding_step": u.get("onboarding_step", 1)      # FROM DB
            }
        }

    except Exception as e:
        print(f"🚩 Handshake Failure: {e}")
        raise HTTPException(status_code=500, detail="Internal Identity Handshake Failed")
    finally:
        conn.close()

# if __name__ == "__main__":
#     import uvicorn
#     # Initializing DB for first run
#     conn = sqlite3.connect(GOVERNMENT_DB)
#     conn.execute('''CREATE TABLE IF NOT EXISTS government_officers 
#                   (id INTEGER PRIMARY KEY, email TEXT UNIQUE, name TEXT, onboarding_step INTEGER, is_onboarded INTEGER)''')
#     conn.close()
#     uvicorn.run(app, host="0.0.0.0", port=8000)

# @app.get("/api/v1/system/status")
# async def get_system_status():
#     """Gatekeeper Logic: Dynamic status check via system_config table."""
#     conn = sqlite3.connect(GOVT_DB)  # system_config lives in government.db
#     cursor = conn.cursor()
#     config_exists = cursor.execute("SELECT 1 FROM system_config LIMIT 1").fetchone()
#     conn.close()
    
#     is_complete = 1  # DEPLOYMENT MODE: Standardized Production Standard
#     return {"is_setup_complete": is_complete}

# # --- REVOLUTIONARY DEVELOPER: UNIFIED ONBOARDING ENDPOINT ---
# @app.post("/api/v1/system/configure")
# async def configure_system(
#     full_name: str = Form(""),
#     email: str = Form(""),
#     phone: str = Form(""),
#     uid: str = Form(""),
#     password: str = Form(""),
#     scope: str = Form(""),
#     specific_role: str = Form(""),
#     workspace_code: str = Form(""),
#     admin_domain: Optional[str] = Form("None"),
#     sla: int = Form(24),
#     desks: int = Form(5),
#     workers: int = Form(20),
#     current_user: str = Depends(get_current_user) # Secure JWT Check
# ):
#     """
#     Step 10: The Sovereign Handshake.
#     This anchors Identity (PII) and Governance Logic (Config) simultaneously.
#     """
#     target_email = current_user

#     conn = sqlite3.connect(GOVT_DB)
#     cursor = conn.cursor()

#     try:
#         # 1. Update the Individual Officer Profile (Identity Anchor)
#         # We save the PII collected during the 9 stages
#         new_hash = hash_password(password)
#         cursor.execute('''
#             UPDATE government_officers 
#             SET phone = ?, uid_number = ?, password_hash = ?, 
#                 admin_body = ?, specific_role = ?, workspace_code = ?, 
#                 admin_domain = ?, is_setup_complete = 1, is_onboarded = 1, onboarding_step = 10
#             WHERE email = ?
#         ''', (phone, uid, new_hash, scope, specific_role, workspace_code, admin_domain, target_email))

#         # 2. Update the Global System Configuration (Administrative Moulding)
#         # This defines how the entire body functions (SLA, Workforce)
#         cursor.execute("DELETE FROM system_config")
#         cursor.execute('''
#             INSERT INTO system_config (
#                 admin_email, admin_name, administrative_scope, sla_hours, 
#                 desk_officers, field_workers, category_mapping
#             ) VALUES (?, ?, ?, ?, ?, ?, ?)''',
#             (target_email, full_name, scope, sla, desks, workers, "{}")
#         )

#         conn.commit()
#         return {"status": "success", "is_setup_complete": 1}

#     except Exception as e:
#         conn.rollback()
#         print(f"Sovereign Error: {e}")
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         conn.close()



# @app.patch("/resolve-grievance/{id}")
# async def resolve_grievance(
#     id: int,
#     after_photo: UploadFile = File(...),
#     current_user: str = Depends(get_current_user)
# ):
#     """Resolution Loop: Immutable Proof of Fix Required"""
#     os.makedirs("uploads/resolutions", exist_ok=True)
#     res_path = f"uploads/resolutions/{id}_{after_photo.filename}"
#     content = await after_photo.read()
#     with open(res_path, "wb") as f:
#         f.write(content)
        
#     conn = sqlite3.connect(DATABASE_PATH)
#     cursor = conn.cursor()
#     cursor.execute(
#         "UPDATE complaints SET status='resolved', resolved_at=CURRENT_TIMESTAMP, resolution_image_path=? WHERE id=?",
#         (res_path, id)
#     )
#     conn.commit()
#     conn.close()
#     return {"message": "Grievance resolved with physical evidence."}


# @app.post("/api/v1/complaints/{id}/issue-job-card")
# async def issue_job_card(id: int, current_user: str = Depends(get_current_user)):
#     """Commander Dispatch: Auto-calculates 2-hour deadline and assigns sovereignty job card."""
#     conn = sqlite3.connect(DATABASE_PATH)
#     cursor = conn.cursor()
    
#     # SYSTEM ARCHITECT: Strict 2-Hour Sovereign Handshake
#     deadline = (datetime.now() + timedelta(hours=2)).isoformat()
    
#     cursor.execute(
#         "UPDATE complaints SET status='assigned', assigned_at=CURRENT_TIMESTAMP, deadline_at=? WHERE id=?",
#         (deadline, id)
#     )
#     conn.commit()
#     conn.close()
#     return {
#         "status": "success", 
#         "message": "COMMANDER DISPATCHED: Job Card Issued. 2-Hour Triage Active.",
#         "deadline": deadline
#     }


# # Route for Government Officials to view complaints (Filtered by Category and Ward)
# @app.get("/get-complaints")
# async def get_complaints(
#     ward: str, 
#     category: str,
#     current_user: str = Depends(get_current_user) # Protected by JWT
# ):
#     try:
#         conn = sqlite3.connect(DATABASE_PATH)
#         conn.row_factory = sqlite3.Row
#         cursor = conn.cursor()

#         search_term = f"%{category.split(' ')[0]}%" if category else "%%"

#         # Fetch system scope for label bridging
#         gconn = sqlite3.connect(GOVT_DB)
#         gcursor = gconn.cursor()
#         config = gcursor.execute("SELECT administrative_scope FROM system_config LIMIT 1").fetchone()
#         scope = config[0] if config else "Municipal"
#         gconn.close()

#         cursor.execute('''
#             SELECT * FROM complaints 
#             WHERE ward_zone = ? AND ai_category LIKE ? AND status IN ('verified', 'assigned', 'resolved')
#             ORDER BY ai_score DESC
#         ''', (ward, search_term))
        
#         rows = cursor.fetchall()
#         complaints = []
#         for row in rows:
#             comp_dict = dict(row)
#             try:
#                 # DECRYPT DATA FOR DISPLAY (PII HARDENING)
#                 raw_name = decrypt_data(comp_dict["full_name"])
#                 raw_phone = str(decrypt_data(comp_dict["phone"]))
                
#                 # DATA MASKING: Only last 3 digits visible
#                 masked_phone = ("*" * (len(raw_phone) - 3)) + raw_phone[-3:] if len(raw_phone) >= 3 else raw_phone
                
#                 # Top-Down Configuration Authority: Label Mapping (Handled by frontend)
#                 comp_dict["full_name"] = raw_name
#                 comp_dict["phone"] = masked_phone
#             except Exception as e:
#                 print(f"Decryption error for record {comp_dict['id']}: {e}")
            
#             complaints.append(comp_dict)


#         conn.close()

#         return complaints
#     except Exception as e:
#         return {"status": "error", "message": str(e)}

# @app.get("/get-ward-stats")
# async def get_ward_stats(
#     ward: str,
#     current_user: str = Depends(get_current_user)
# ):
#     try:
#         conn = sqlite3.connect(DATABASE_PATH)
#         cursor = conn.cursor()
#         cursor.execute('''
#             SELECT ai_category, COUNT(*)
#             FROM complaints
#             WHERE ward_zone = ? AND status = 'verified'
#             GROUP BY ai_category
#         ''', (ward,))
#         results = cursor.fetchall()
#         stats = {row[0]: row[1] for row in results}
#         conn.close()
#         return {
#             "ward": ward,
#             "stats": stats
#         }

#     except Exception as e:
#         return {"status": "error", "message": str(e)}