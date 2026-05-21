import uvicorn
from fastapi import APIRouter, HTTPException, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware # 1. Import CORS
from pydantic import BaseModel
import sqlite3
import os
import shutil
import smtplib
from email.message import EmailMessage
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Form, UploadFile, File

# Initialize
load_dotenv()
# app = FastAPI()
router = APIRouter(tags=["Status"])

# 2. CONFIGURE CORS
# This allows your React app (Vite/CRA) to talk to this Python server
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173", 
#         "http://127.0.0.1:5173",
#         "http://localhost:3000"
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Get the absolute path to the directory this script is in
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths to your databases
GRIEVANCE_DB = os.path.join(BASE_DIR, "grievance.db")
GOVERNMENT_DB = os.path.join(BASE_DIR, "government.db")
UPLOAD_DIR = "resolved_proofs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- ENCRYPTION LOGIC ---
ENCRYPTION_KEY_RAW = os.getenv("ENCRYPTION_KEY", "32-bytes-of-sovereign-intelligence-key!")
key_bytes = ENCRYPTION_KEY_RAW.encode().ljust(32)[0:32]
aesgcm = AESGCM(key_bytes)

def decrypt_data(encrypted_hex):
    try:
        nonce = bytes.fromhex(encrypted_hex[:24])
        ciphertext = bytes.fromhex(encrypted_hex[24:])
        return aesgcm.decrypt(nonce, ciphertext, None).decode()
    except Exception:
        return "Decryption Error"

# --- DATA MODELS ---
class StatusUpdate(BaseModel):
    latitude: float
    longitude: float
    category: str
    updated_by_role: str
    new_status: str

class AllocationRequest(BaseModel):
    latitude: float
    longitude: float
    category: str
    contractor_id: str
    contractor_name: str
    workspace_code: str  # Added to match contractor in govt db
    officer_name: str
    contractor_email: str

class MissionResolution(BaseModel):
    complaint_id: int
    contractor_name: str

# --- EMAIL LOGIC ---
SMTP_EMAIL = "rajeedandge444@gmail.com"
SMTP_PASSWORD = "zkpm slsj txnh bclm"

# --- FIXED EMAIL LOGIC ---
def send_status_email(receiver_email, complaint_title, new_status):
    msg = EmailMessage()
    # Use the arguments passed to the function!
    content = (f"Hello Citizen,\n\n"
               f"Your complaint regarding '{complaint_title}' has been updated to: {new_status}.\n"
               f"Thank you for using Nivaran AI to improve our city.")
    msg.set_content(content)
    msg['Subject'] = f"Grievance Status Update: {complaint_title}"
    msg['From'] = SMTP_EMAIL
    msg['To'] = receiver_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(SMTP_EMAIL, SMTP_PASSWORD)
            smtp.send_message(msg)
            return True
    except Exception as e:
        print(f"SMTP Error: {e}")
        return False

# Add this function to status_update.py
def send_contractor_notification(contractor_email, contractor_name, category, officer_name, location_str):
    msg = EmailMessage()
    content = (f"Hello {contractor_name},\n\n"
               f"A new complaint has been assigned to you by Desk Officer {officer_name}.\n\n"
               f"MISSION DETAILS:\n"
               f"Type: {category}\n"
               f"Location: {location_str}\n\n"
               f"Please log in to the portal to view details.")
    msg.set_content(content)
    msg['Subject'] = f"NEW ASSIGNMENT: {category}"
    msg['From'] = SMTP_EMAIL
    msg['To'] = contractor_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(SMTP_EMAIL, SMTP_PASSWORD)
            smtp.send_message(msg)
    except Exception as e:
        print(f"Contractor Email Error: {e}")

def send_allocation_email(receiver_email, complaint_title, contractor_name):
    msg = EmailMessage()
    content = (f"Dear Citizen,\n\nYour complaint regarding '{complaint_title}' "
               f"has been officially assigned to our contractor: {contractor_name}.\n"
               f"Resolution is now in progress.\n\nNivaran AI Team")
    msg.set_content(content)
    msg['Subject'] = f"Contractor Assigned: {complaint_title}"
    msg['From'] = SMTP_EMAIL
    msg['To'] = receiver_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(SMTP_EMAIL, SMTP_PASSWORD)
            smtp.send_message(msg)
    except Exception as e:
        print(f"Email error: {e}")

# --- ROUTES ---

@router.get("/api/get-complaints")
async def get_complaints(zone: str):
    try:
        clean_zone = zone.strip()
        # If no zone is provided, return empty list instead of crashing
        if not zone or zone == "undefined":
            return []

        conn = sqlite3.connect(GRIEVANCE_DB)
        conn.row_factory = sqlite3.Row  # This allows us to access by column name
        cursor = conn.cursor()
        
        # We use a case-insensitive match for the zone
        cursor.execute("SELECT * FROM complaints WHERE ward_zone LIKE ?", (f"%{clean_zone}%",))
        rows = cursor.fetchall()
        conn.close()

        results = []
        for row in rows:
            d = dict(row)
            try:
                # Force types to prevent Leaflet map crashes
                if d['latitude'] and d['longitude']:
                    d['latitude'] = float(d['latitude'])
                    d['longitude'] = float(d['longitude'])
                    results.append(d)
            except (ValueError, TypeError):
                continue 
                
        return results
    except Exception as e:
        print(f"Database Error: {e}")
        return []

# @app.post("/api/get-complaints")
# async def get_complaints(zone: str):
#     try:
#         conn = sqlite3.connect("./grievance.db")
#         conn.row_factory = sqlite3.Row  # This allows us to access by column name
#         cursor = conn.cursor()
        
#         # We use a case-insensitive match for the zone
#         cursor.execute("SELECT * FROM complaints WHERE LOWER(ward_zone) = LOWER(?)", (zone,))
#         rows = cursor.fetchall()
#         conn.close()

#         results = []
#         for row in rows:
#             d = dict(row)
#             try:
#                 # CRITICAL: Leaflet fails if these are strings. Force to float.
#                 d['latitude'] = float(d['latitude']) if d['latitude'] else None
#                 d['longitude'] = float(d['longitude']) if d['longitude'] else None
                
#                 # Only add to list if coordinates are actually valid
#                 if d['latitude'] is not None and d['longitude'] is not None:
#                     results.append(d)
#             except (ValueError, TypeError):
#                 continue 
                
#         return results
#     except Exception as e:
#         print(f"Database Error: {e}")
#         return []

@router.get("/api/complaint-count")
async def get_complaint_count(lat: float, lng: float, category: str):
    conn = sqlite3.connect("./grievance.db")
    cursor = conn.cursor()
    # Count how many people filed a complaint at this spot with this category
    cursor.execute("""
        SELECT COUNT(*) FROM complaints 
        WHERE latitude = ? AND longitude = ? AND ai_category = ?
    """, (lat, lng, category))
    count = cursor.fetchone()[0]
    conn.close()
    return {"count": count}

@router.post("/api/update-complaint-status")
async def update_status(data: StatusUpdate):
    # Logic to update DB and send email
    conn = sqlite3.connect("./grievance.db")
    cursor = conn.cursor()
    
    clean_category = data.category.strip()
    
    # 2. Use a Buffer for GPS coordinates (0.0001 is approx 10 meters)
    # This ensures we find the complaint even if the float has tiny rounding errors
    query_params = (data.latitude, data.longitude, f"%{clean_category}%")
    
    # FETCH EMAILS
    cursor.execute("""
        SELECT email FROM complaints 
        WHERE ABS(latitude - ?) < 0.0001 
        AND ABS(longitude - ?) < 0.0001 
        AND ai_category LIKE ?
    """, query_params)
    
    rows = cursor.fetchall()
    
    if not rows:
        conn.close()
        return {"status": "error", "message": "No complaints found at this location."}

    # UPDATE STATUS (Use the SAME ABS logic as the SELECT query)
    cursor.execute("""
        UPDATE complaints SET status = ? 
        WHERE ABS(latitude - ?) < 0.0001 
        AND ABS(longitude - ?) < 0.0001 
        AND ai_category LIKE ?
    """, (data.new_status, data.latitude, data.longitude, f"%{clean_category}%"))

    conn.commit()
    conn.close()

    # SEND EMAILS
    count = 0
    for r in rows:
        encrypted_email = r[0]
        if not encrypted_email:
            continue
            
        # real_email = decrypt_data(encrypted_email)
        
        if encrypted_email != "Decryption Error" and "@" in encrypted_email:
            # We send the email
            success = send_status_email(encrypted_email, clean_category, data.new_status)
            if success:
                count += 1
        else:
            print(f"DEBUG: Decryption failed or invalid email format: {encrypted_email}")
    
    return {
        "status": "success", 
        "message": f"Updated and sent {count} emails to affected citizens."
    }

@router.get("/api/contractor-missions/{name}")
async def get_missions(name: str):
    conn = sqlite3.connect(GRIEVANCE_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints WHERE contractor_id = ? AND status = 'assigned'", (name,))
    missions = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return missions
    
@router.post("/api/allocate-contractor")
async def allocate_contractor(data: AllocationRequest):
    # complaint_id: int = Form(...),
    contractor_email: str = data.contractor_email
    contractor_name: str = data.contractor_name

    with sqlite3.connect(GOVERNMENT_DB) as govt_conn:
        govt_cursor = govt_conn.cursor()
        govt_cursor.execute("SELECT email FROM government_officers WHERE email = ?", (contractor_email,))
        result = govt_cursor.fetchone()
        # if result: contractor_email = result[0]

    if not result:
        raise HTTPException(status_code=404, detail="Contractor email not found.")

    with sqlite3.connect(GRIEVANCE_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE complaints SET contractor_id = ?, status = 'assigned', assigned_at = CURRENT_TIMESTAMP
            WHERE latitude = ? AND longitude = ? AND (ai_category = ? OR ai_category LIKE ?)
        """, (data.contractor_name, data.latitude, data.longitude, data.category, f"%{data.category}%"))
        
        if cursor.rowcount == 0:
             raise HTTPException(status_code=404, detail="Complaint matching these coordinates/category not found.")

        cursor.execute("SELECT email FROM complaints WHERE latitude = ? AND longitude = ? AND ai_category LIKE ?", (data.latitude, data.longitude, f"%{data.category}%"))
        citizen_emails = cursor.fetchall()

    send_contractor_notification(contractor_email, data.contractor_name, data.category, data.officer_name, f"{data.latitude}, {data.longitude}")
    for r in citizen_emails:
        try: send_allocation_email(decrypt_data(r[0]), data.category, data.contractor_name)
        except Exception as e:
            print(f"Email skip: {e}")
            continue

    return {"status": "success"}

@router.get("/api/contractor-dashboard/{contractor_email}")
async def get_contractor_full_dashboard(contractor_email: str):
    """
    Fetches all complaints linked to a contractor and groups them by status.
    Used for the Mission Dashboard UI.
    """
    try:
        conn = sqlite3.connect(GRIEVANCE_DB)
        conn.row_factory = sqlite3.Row  # Crucial for returning dictionary-like objects
        cursor = conn.cursor()
        
        # Match contractor_name with the contractor_id field in your complaints table
        cursor.execute("""
            SELECT id, ai_category, location, status, latitude, longitude, 
                   image_path, resolution_image_path, created_at, assigned_at, resolved_at
            FROM complaints 
            WHERE contractor_id = ?
        """, (contractor_email,))
        
        all_tasks = [dict(row) for row in cursor.fetchall()]
        conn.close()

        # Organize into sections for the UI
        dashboard_data = {
            "current": [t for t in all_tasks if t['status']in ['assigned', 'in progress']],
            "assigned": [t for t in all_tasks if t['status'] == 'assigned'],
            "resolved": [t for t in all_tasks if t['status'] == 'resolved']
        }
        
        return dashboard_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
          
@router.post("/api/resolve-mission")
async def resolve_mission(
    complaint_id: int = Form(...),
    contractor_email: str = Form(...),
    image: UploadFile = File(...)
):
    # 1. Save File
    file_path = os.path.join(UPLOAD_DIR, f"resolved_{complaint_id}_{image.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # 2. Update DB & Get Citizen Emails
    with sqlite3.connect(GRIEVANCE_DB) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT email, ai_category FROM complaints WHERE id = ?", (complaint_id,))
        complaint = cursor.fetchone()
        
        cursor.execute("""
            UPDATE complaints 
            SET status = 'resolved', resolution_image_path = ?, resolved_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        """, (file_path, complaint_id))

    # 3. Notify Citizens of resolution
    if complaint:
        try:
            citizen_email = decrypt_data(complaint[0])
            print(f"Attempting to send to: {citizen_email}")
            msg = EmailMessage()
            msg.set_content(f"Great news! Your complaint regarding {complaint[1]} has been marked as RESOLVED by our agent.")
            msg['Subject'] = "Complaint Resolved"
            msg['From'] = SMTP_EMAIL
            msg['To'] = citizen_email
            with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
                smtp.login(SMTP_EMAIL, SMTP_PASSWORD)
                smtp.send_message(msg)
        except: print(f"CRITICAL ERROR in Email Logic: {e}")

    return {"status": "success", "image_path": file_path}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("status_update:app", host="0.0.0.0", port=8000, reload=True)
