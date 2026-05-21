

from datetime import datetime, timedelta # 1. ADDED MISSING IMPORTS
from detective import decrypt_data
from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import BaseModel
import sqlite3
import os
from datetime import datetime, timedelta
from typing import Optional 

SECRET_KEY = "super-secret-government-key"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")



router = APIRouter(prefix="/api/v1/desk", tags=["Desk Officer"])

DATABASE_PATH = "grievance.db"

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid Token")
        return username
    except:
        raise HTTPException(status_code=401, detail="Session Expired")

@router.get("/dashboard-stats")
async def get_desk_stats(ward: str='General', domain: str='Roads'):
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # 2. REVOLUTIONARY FIX: Use LIKE with wildcards
        # This allows "Roads" to match "Roads & Infrastructure"
        domain = domain.strip()
        search_term = f"%{domain}%"

        # Query 1: Total Load
        cursor.execute('''
            SELECT COUNT(*) FROM complaints 
            WHERE ward_zone=? AND ai_category LIKE ? AND status IN ('verified', 'assigned', 'resolved')
        ''', (ward, search_term))
        total_tasks = cursor.fetchone()[0]

        if total_tasks == 0:
            return {"total_today": 0, "urgent_count": "00", "sla_compliance": "100%"}

        # Query 2: Resolved on time
        cursor.execute('''
            SELECT COUNT(*) FROM complaints 
            WHERE ward_zone=? AND ai_category LIKE ? 
            AND status = 'resolved' 
            AND resolved_at <= deadline_at
        ''', (ward, search_term))
        on_time_resolved = cursor.fetchone()[0]

        # Query 3: Urgent count
        cursor.execute('''
            SELECT COUNT(*) FROM complaints 
            WHERE ward_zone=? AND ai_category LIKE ? AND ai_score >= 8.0 AND status != 'resolved'
        ''', (ward, search_term))
        urgent = cursor.fetchone()[0]

        compliance_rate = (on_time_resolved / total_tasks) * 100

        conn.close()
        return {
            "total_today": total_tasks,
            "urgent_count": f"{urgent:02d}",
            "sla_compliance": f"{int(compliance_rate)}%"
        }
    except Exception as e:
        print(f"SLA Calculation Error: {e}")
        return {"status": "error", "message": str(e)}


        



@router.get("/contractors")
async def get_contractors(ward: str=None, domain: str=None):
    # """REVOLUTIONARY: Real-time Load Balancing Audit."""
    print(f"📥 Received request for Ward: {ward}")
    
    try:
        target_ward = ward if (ward and ward != "undefined") else "Dombivli East"
        # target_domain = domain if domain and domain != "undefined" else "Roads"

        # 1. Connect to Government DB to get the team
        with sqlite3.connect("government.db") as gconn:
            gconn.row_factory = sqlite3.Row
            cursor_g = gconn.cursor()
            cursor_g.execute("""
                SELECT workspace_code FROM government_officers 
                WHERE location LIKE ? AND admin_role = 'Desk_Officer' 
                LIMIT 1
            """, (f"%{target_ward}%",))
            
            officer_row = cursor_g.fetchone()
            if not officer_row:
                print(f"⚠️ No Desk Officer found for ward: {target_ward}")
                return []
            
            target_workspace = officer_row['workspace_code'] if officer_row else "DOM-E-2026"

            # 2. Get all contractors who have that SAME workspace_code
            cursor_g.execute("""
                SELECT name,email,phone, specific_role  
                FROM government_officers 
                WHERE workspace_code = ? AND admin_role = 'Contractor'
            """, (target_workspace,))
            
            officers = [dict(row) for row in cursor_g.fetchall()]
        # 2. Connect to Grievance DB to calculate their active workload
        # with sqlite3.connect("grievance.db") as gr_conn:
        #     cursor_gr = gr_conn.cursor()
        #     for officer in officers:
        #         cursor_gr.execute("SELECT COUNT(*) FROM complaints WHERE contractor_id = ? AND status = 'assigned'", (officer['name'],))
        #         load = cursor_gr.fetchone()[0]
                
        #         # DERIVE STATUS NON-VERBALLY
        #         officer['current_load'] = load
        #         officer['availability'] = "Available" if load == 0 else "Active" if load < 3 else "Overloaded"
        #         officer['color'] = "#10B981" if load == 0 else "#F59E0B" if load < 3 else "#EF4444"

        return officers
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/contractor-portfolio/{name}")
async def get_contractor_portfolio(name: str):
    """REVOLUTIONARY: Automated Performance Audit for a specific contractor."""
    try:
        # 1. Connect to Grievance DB to see their work history
        with sqlite3.connect("grievance.db") as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Fetch all resolved tasks by this contractor
            cursor.execute('''
                SELECT id, location, ai_score, image_path, resolution_image_path, 
                       created_at, resolved_at 
                FROM complaints 
                WHERE contractor_id = ? AND status = 'resolved'
            ''', (name,))
            history = [dict(row) for row in cursor.fetchall()]

        # 2. Calculate Real-time Metrics
        total_resolved = len(history)
        
        # Calculate Efficiency (Demo logic: if we have 5 resolved items, efficiency is high)
        efficiency = "98%" if total_resolved > 5 else "85%" if total_resolved > 0 else "N/A"
        
        return {
            "name": name,
            "total_resolved": total_resolved,
            "efficiency_score": efficiency,
            "work_history": history # This contains the Before/After photo links
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-performance-stats")
async def get_my_performance(ward: str, domain: str, current_user: str = Depends(get_current_user)):
    """REVOLUTIONARY: Personal Accountability & Velocity Analytics."""
    try:
        with sqlite3.connect("grievance.db") as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            search_term = f"%{domain.strip()}%"

            # 1. Total Resolved by this desk
            cursor.execute('''
                SELECT COUNT(*) FROM complaints 
                WHERE ward_zone=? AND ai_category LIKE ? AND status='resolved'
            ''', (ward, search_term))
            total_resolved = cursor.fetchone()[0]

            # 2. Average Resolution Time Logic (The "Speed" Metric)
            # We calculate difference between assigned_at and resolved_at
            cursor.execute('''
                SELECT AVG(julianday(resolved_at) - julianday(assigned_at)) * 24 
                FROM complaints 
                WHERE ward_zone=? AND ai_category LIKE ? AND status='resolved'
            ''', (ward, search_term))
            avg_hours = cursor.fetchone()[0] or 0

            # 3. Personal SLA Compliance (%)
            cursor.execute('''
                SELECT COUNT(*) FROM complaints 
                WHERE ward_zone=? AND ai_category LIKE ? AND status='resolved' AND resolved_at <= deadline_at
            ''', (ward, search_term))
            on_time = cursor.fetchone()[0]
            sla_score = (on_time / total_resolved * 100) if total_resolved > 0 else 100

            return {
                "avg_speed": f"{round(avg_hours, 1)} hrs",
                "resolved_total": total_resolved,
                "sla_percentage": int(sla_score),
                "performance_rank": "Exceptional" if sla_score > 90 else "Standard"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Performance Analytics Offline")

# --- desk_routes.py ---


@router.get("/severity-trend")
async def get_severity_trend(ward: str, domain: str):
    try:
        with sqlite3.connect("grievance.db") as conn:
            cursor = conn.cursor()
            domain = domain.strip()
            search_term = f"%{domain}%"
            trend_data = []
            
            for i in range(6, -1, -1):
                # Calculate the date for the last 7 days
                target_date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
                day_name = (datetime.now() - timedelta(days=i)).strftime('%a')
                
                # REVOLUTIONARY FIX: 
                # 1. Use AVG(ai_score) to show real severity trend.
                # 2. Use strftime to normalize the SQLite date comparison.
                cursor.execute('''
                    SELECT AVG(ai_score) FROM complaints 
                    WHERE ward_zone=? AND ai_category LIKE ? 
                    AND strftime('%Y-%m-%d', created_at) = ?
                ''', (ward, search_term, target_date))
                
                avg_val = cursor.fetchone()[0]
                # If no data for that day, return 0.0
                score = round(float(avg_val), 1) if avg_val else 0.0
                
                trend_data.append({"day": day_name, "val": score})
            
            return trend_data
    except Exception as e:
        print(f"Trend Calculation Error: {e}")
        return []

@router.get("/inbox")
async def get_desk_inbox(ward: str, domain: str):
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        domain = domain.strip()
        search_term = f"%{domain}%"
        
        # Updated to LIKE
        cursor.execute('''
            SELECT id, location, ai_score, status, contractor_id, full_name 
            FROM complaints 
            WHERE ward_zone=? AND ai_category LIKE ? AND status != 'rejected'
            ORDER BY ai_score DESC
        ''', (ward, search_term))
        
        rows = cursor.fetchall()
        complaints = []
        for row in rows:
            d = dict(row)
            d["full_name"] = decrypt_data(d["full_name"])
            complaints.append(d)
            
        conn.close()
        return complaints
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/officers")
async def get_ward_officers(ward: str, current_user: str = Depends(get_current_user)):
    """
    Personnel Command: 
    Fetches all Desk Officers in the Admin's ward with their current load.
    """
    try:
        # 1. Connect to Government DB to find the team
        with sqlite3.connect("government.db") as gconn:
            gconn.row_factory = sqlite3.Row
            cursor_g = gconn.cursor()
            # Fetch everyone who is a Desk_Officer in this specific ward
            cursor_g.execute('''
                SELECT name, email, phone, specific_role, admin_domain 
                FROM government_officers 
                WHERE location = ? AND admin_role = 'Desk_Officer'
            ''', (ward,))
            officers = [dict(row) for row in cursor_g.fetchall()]

        # 2. Connect to Grievance DB to calculate their real-time performance
        with sqlite3.connect("grievance.db") as gr_conn:
            cursor_gr = gr_conn.cursor()
            for off in officers:
                # Calculate assigned (active) tasks
                # We assume the 'contractor_id' in complaints stores the officer's email or name
                cursor_gr.execute('''
                    SELECT COUNT(*) FROM complaints 
                    WHERE contractor_id = ? AND status = 'assigned'
                ''', (off['email'],))
                off['current_load'] = cursor_gr.fetchone()[0]

                # Calculate total resolved tasks
                cursor_gr.execute('''
                    SELECT COUNT(*) FROM complaints 
                    WHERE contractor_id = ? AND status = 'resolved'
                ''', (off['email'],))
                off['total_resolved'] = cursor_gr.fetchone()[0]
                
                # Mock status for UI visualization
                off['status'] = 'Active' if off['current_load'] > 0 else 'Standby'
                off['color'] = '#10B981' if off['status'] == 'Active' else '#94a3b8'

        return officers
    except Exception as e:
        print(f"❌ Personnel Fetch Error: {e}")
        return []

# Add this model at the top of desk_routes.py
class DispatchRequest(BaseModel):
    officer_email: str

# Update the route definition
@router.post("/job-card/{complaint_id}")
async def issue_job_card(
    complaint_id: int, 
    data: DispatchRequest, # Changed from Form to Pydantic for JSON compatibility
    current_user: str = Depends(get_current_user)
):
    """
    Mission Dispatch: 
    Formally assigns a grievance to an officer and sets the 24h deadline.
    """
    try:
        with sqlite3.connect("grievance.db") as conn:
            # Set deadline to 24 hours from now
            deadline = (datetime.now() + timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")
            
            conn.execute('''
                UPDATE complaints 
                SET contractor_id = ?, 
                    status = 'assigned', 
                    assigned_at = CURRENT_TIMESTAMP,
                    deadline_at = ? 
                WHERE id = ?
            ''', (data.officer_email, deadline, complaint_id))
            conn.commit()
            
        return {"status": "success", "message": f"Task dispatched to {data.officer_email}"}
    except Exception as e:
        print(f"❌ Dispatch Crash: {e}")
        raise HTTPException(status_code=500, detail="Internal Dispatch Failure")