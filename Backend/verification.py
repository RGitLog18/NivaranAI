from pydantic import BaseModel
import sqlite3
import os
import hashlib
import random
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, Form, UploadFile, File

# --- CONFIG ---
DATABASE_PATH = os.getenv("GOVT_DB_PATH", "government.db")   # Officers & auth tables
SMTP_EMAIL = "rajeedandge444@gmail.com" 
SMTP_PASSWORD = "zkpm slsj txnh bclm" 

# Stores OTPs and verification status: { email: { "code": "...", "verified": False, "role": "..." } }
auth_context = {}

# --- HELPERS ---
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def send_email(target, subject, body):
    """
    Sovereign Mail Engine: Secure SMTP Pipeline.
    Refactored to SMTP_SSL (Port 465) for industrial-grade stability.
    """
    from email.mime.multipart import MIMEMultipart
    
    msg = MIMEMultipart()
    msg['Subject'] = subject
    msg['From'] = SMTP_EMAIL
    msg['To'] = target
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        # SYSTEMS ARCHITECT: Switching to Port 465 (Implicit SSL) to bypass STARTTLS read timeouts
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30)
        # server.set_debuglevel(1) # Enable only for low-level protocol debugging
        
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except smtplib.SMTPAuthenticationError:
        print("CRITICAL: SMTP Authentication Failed. Check App Password.")
        return False
    except Exception as e:
        print(f"Nivaran Mail Engine Error: {e}")
        # FAIL-OVER: Log the error and allow the pipeline to continue (Non-Blocking)
        return False

# --- MODELS ---
class OTPRequest(BaseModel):
    email: str
    name: str
    role: str
    is_signup: bool = False

class VerifyRequest(BaseModel):
    email: str
    code: str

class CitizenFinal(BaseModel):
    name: str
    email: str
    phone: str
    uid_number: str
    password: str

# --- CORE LOGIC ---
def init_verification_db(ccursor, gcursor):
    """Called from main init_db to set up verification tables."""
    ccursor.execute('''CREATE TABLE IF NOT EXISTS citizens (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT, 
        email TEXT UNIQUE, 
        phone TEXT, 
        uid_number TEXT, 
        password_hash TEXT, 
        role TEXT DEFAULT 'citizen'
    )''')
    gcursor.execute('''CREATE TABLE IF NOT EXISTS government_officers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    email TEXT UNIQUE, 
    phone TEXT, 
    location TEXT, 
    uid_number TEXT, 
    proof_path TEXT, 
    password_hash TEXT, 
    role TEXT DEFAULT 'government',
    admin_role TEXT DEFAULT 'Desk_Officer',
    admin_body TEXT,
    specific_role TEXT,
    workspace_code TEXT,
    admin_domain TEXT,
    is_setup INTEGER DEFAULT 0, -- <--- ADD THIS LINE
    is_setup_complete INTEGER DEFAULT 0,
    onboarding_step INTEGER DEFAULT 1,
    is_onboarded INTEGER DEFAULT 0
)''')
    
    # --- MIGRATION: Schema Hardening for Sovereign Workflow ---
    cols = {
        "is_setup": "INTEGER DEFAULT 0",
        "is_setup_complete": "INTEGER DEFAULT 0",
        "location": "TEXT",
        "onboarding_step": "INTEGER DEFAULT 1",
        "admin_body": "TEXT",
        "specific_role": "TEXT",
        "workspace_code": "TEXT",
        "is_onboarded": "INTEGER DEFAULT 0",
        "admin_domain": "TEXT"
    }
    for col, definition in cols.items():
        try:
            gcursor.execute(f"ALTER TABLE government_officers ADD COLUMN {col} {definition}")
        except sqlite3.OperationalError:
            pass # Column already exists