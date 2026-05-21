import sqlite3
import os

GOVT_DB = "government.db"
GRIEVANCE_DB = "grievance.db"

def migrate_contractor_ids():
    # 1. Connect to Government DB to get the Name -> Email map
    try:
        g_conn = sqlite3.connect(GOVT_DB)
        g_cursor = g_conn.cursor()
        
        # Get all contractors
        g_cursor.execute("SELECT name, email FROM government_officers WHERE admin_role = 'Contractor'")
        contractor_list = g_cursor.fetchall() # List of (Name, Email)
        g_conn.close()
        
        if not contractor_list:
            print("⚠️ No contractors found in Government DB. Nothing to migrate.")
            return

        # 2. Connect to Grievance DB to perform the update
        gr_conn = sqlite3.connect(GRIEVANCE_DB)
        gr_cursor = gr_conn.cursor()
        
        total_updated = 0
        
        print("🚀 Starting Migration: Name -> Email...")
        
        for name, email in contractor_list:
            # Update complaints where the contractor_id is currently the NAME
            gr_cursor.execute("""
                UPDATE complaints 
                SET contractor_id = ? 
                WHERE contractor_id = ?
            """, (email.lower(), name))
            
            rows_affected = gr_cursor.rowcount
            if rows_affected > 0:
                print(f"✅ Updated {rows_affected} tasks for: {name} -> {email}")
                total_updated += rows_affected

        gr_conn.commit()
        gr_conn.close()
        
        print(f"\n✨ Migration Complete. Total tasks updated: {total_updated}")

    except Exception as e:
        print(f"❌ Error during migration: {e}")

if __name__ == "__main__":
    migrate_contractor_ids()