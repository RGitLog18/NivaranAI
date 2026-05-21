from fastapi import APIRouter, HTTPException, Form, Depends, File, UploadFile
import sqlite3
import os
import bcrypt
from datetime import datetime
from typing import Optional
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(tags=["Onboarding"])

# --- CONFIG (STRICTLY MATCHED TO TAKEIMAGE.PY) ---
GOVERNMENT_DB = os.getenv("GOVERNMENT_DB_PATH", "government.db")
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-government-key") 
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- HELPERS ---
def hash_password(password: str) -> str:
    """Direct Hashing to fix passlib 72-byte error"""
    if not password: return ""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """FIXES 401: Properly decodes the Bearer token from the Header"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid Token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Session Expired or Invalid")

# --- APIS ---

@router.get("/api/onboarding/status")
async def get_onboarding_status(email: str):
    conn = sqlite3.connect(GOVERNMENT_DB)
    conn.row_factory = sqlite3.Row
    try:
        user = conn.execute("SELECT onboarding_step, is_setup_complete, phone FROM government_officers WHERE email = ?", (email.lower(),)).fetchone()
        
        if not user:
            return {"onboarding_step": 1, "skip_otp": False}
        
        u = dict(user)
        
        # --- THE FIX ---
        # If the DB says 10, but the person is NOT fully onboarded and has NO data (phone),
        # it means it's a fresh record or a bug. Force them to Step 1.
        step = u["onboarding_step"]
        if step >= 10 and u["is_setup_complete"] == 0 and not u["phone"]:
            step = 1

        return {
            "onboarding_step": step, 
            "is_setup_complete": u["is_setup_complete"],
            "skip_otp": True
        }
    finally:
        conn.close()

@router.patch("/api/onboarding/update-step")
async def update_step(email: str = Form(...), step: int = Form(...), field: str = Form(None), value: str = Form(None)):
    conn = sqlite3.connect(GOVERNMENT_DB)
    try:
        # Standardize: Map React 'phone' to DB 'phone'
        attr_map = {"phone": "phone", "uid_number": "uid_number", "location": "location","password_hash": "password_hash"}
        db_field = attr_map.get(field, field)
        
        # 🚩 THE FIX: Hash the password if it's arriving at this step
        final_value = value
        if db_field == "password_hash" and value:
            final_value = hash_password(value)

        conn.execute("INSERT OR IGNORE INTO government_officers (email) VALUES (?)", (email.lower(),))
        if db_field and value:
            conn.execute(f"UPDATE government_officers SET onboarding_step = ?, {db_field} = ? WHERE email = ?", (step, final_value, email.lower()))
        else:
            conn.execute("UPDATE government_officers SET onboarding_step = ? WHERE email = ?", (step, email.lower()))
        conn.commit()
        return {"status": "success"}
    finally:
        conn.close()

# --- 1. THE HIERARCHY MAP (The Logic) ---
# This ensures roles are assigned perfectly every time
ROLE_MAP = {
    # Admin Dashboard
    'Sarpanch': 'Admin',
    'Assistant Commissioner': 'Admin',
    'Chief Officer': 'Admin',
    
    # Desk Dashboard
    'Gram Sevak': 'Desk_Officer',
    'Junior Engineer': 'Desk_Officer',
    'Sanitary Inspector': 'Desk_Officer',
    
    # Contractor Portal
    'Gram Rozgar Sahayak': 'Contractor',
    'Zonal Agency': 'Contractor',
    'Dept Contractor': 'Contractor'
}

# onboarding.py - UPDATE THIS FUNCTION
@router.post("/api/v1/system/configure")
async def configure_system(
    full_name: str = Form(""),
    email: str = Form(""),
    phone: str = Form(""),
    uid_number: str = Form(""),
    password: str = Form(""),
    scope: str = Form(""),
    specific_role: str = Form(""),
    workspace_code: str = Form(""),
    admin_domain: Optional[str] = Form("None"),
    current_user: str = Depends(get_current_user)
):
    # 🚩 DEBUG: Print these to your terminal to see if they are empty
    print(f"DEBUG: Received UID: {uid_number}")
    print(f"DEBUG: Received Password: {'[HIDDEN]' if password else 'EMPTY'}")
    print(f"DEBUG: Received Phone: {phone}")
    conn = sqlite3.connect("government.db")
    cursor = conn.cursor()

    try:
        # 1. THE LOGIC HANDSHAKE: Map Specific Title to technical Admin Role
        ROLE_MAP = {
            'Sarpanch': 'Admin', 'Assistant Commissioner': 'Admin', 'Chief Officer': 'Admin',
            'Gram Sevak': 'Desk_Officer', 'Junior Engineer': 'Desk_Officer', 'Sanitary Inspector': 'Desk_Officer',
            'Gram Rozgar Sahayak': 'Contractor', 'Zonal Agency': 'Contractor', 'Dept Contractor': 'Contractor'
        }
        
        # Determine technical role and domain
        final_admin_role = ROLE_MAP.get(specific_role, "Desk_Officer")
        # Admins oversee everything, so they get 'All' as a domain to prevent NULLs
        final_domain = "All" if final_admin_role == "Admin" else admin_domain

        # 2. THE DB STORAGE: Update every column explicitly
        # We ensure 'role' is set to 'government' and 'is_setup_complete' is 1
        cursor.execute('''
            UPDATE government_officers 
            SET name = ?, 
                phone = ?, 
                uid_number = ?, 
                password_hash = ?, 
                admin_body = ?, 
                specific_role = ?, 
                workspace_code = ?, 
                admin_domain = ?, 
                admin_role = ?, 
                role = 'government',
                is_setup_complete = 1, 
                onboarding_step = 10, 
                is_onboarded = 1
            WHERE email = ?
        ''', (
            full_name, 
            phone, 
            uid_number, 
            hash_password(password), 
            scope, 
            specific_role, 
            workspace_code, 
            final_domain, 
            final_admin_role, 
            current_user.lower()
        ))

        # 3. THE GLOBAL CONFIG: Update the system summary table
        cursor.execute("DELETE FROM system_config")
        cursor.execute('''
            INSERT INTO system_config (admin_email, admin_name, administrative_scope) 
            VALUES (?, ?, ?)''', (current_user.lower(), full_name, scope))

        conn.commit() # 🚩 CRITICAL: This is what saves the data to the disk!
        
        print(f"✅ Identity Anchored: {full_name} saved as {final_admin_role}")
        
        return {
            "status": "success",
            "role": "government",  
            "admin_role": final_admin_role, 
            "is_setup_complete": 1
        }

    except Exception as e:
        conn.rollback()
        print(f"❌ DATA SAVING FAILED: {e}")
        raise HTTPException(status_code=500, detail=f"Database Handshake Failure: {str(e)}")
    finally:
        conn.close()
        
@router.get("/api/onboarding/check-code")
async def check_workspace_code(code: str, location: str):
    """
    REAL DATABASE HANDSHAKE:
    Validates staff entry by finding the Admin who generated the code.
    """
    conn = sqlite3.connect(GOVERNMENT_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Search for the boss of this jurisdiction with the matching code
        # We check for Admin role or high-level titles
        cursor.execute('''
            SELECT name, admin_body, specific_role 
            FROM government_officers 
            WHERE workspace_code = ? 
            AND location = ? 
            AND (admin_role = 'Admin' OR specific_role IN ('Sarpanch', 'Assistant Commissioner', 'Chief Officer'))
        ''', (code, location))
        
        admin_record = cursor.fetchone()

        if not admin_record:
            # If no Boss is found with that code in that area
            raise HTTPException(
                status_code=404, 
                detail=f"Security Key Error: No active administration found for code '{code}' in '{location}'."
            )

        admin = dict(admin_record)
        return {
            "valid": True,
            "admin_name": admin["name"],
            "admin_body": admin["admin_body"],
            "admin_title": admin["specific_role"],
            "message": f"Handshake Successful. Connected to {admin['name']}'s office."
        }
        
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database Handshake Failure: {str(e)}")
    finally:
        conn.close()