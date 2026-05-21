import sqlite3
import os

# Ensure this points to your actual government.db file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "government.db")

def fix_nerul_west_workspace():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("🛠️ Aligning Workspace Codes for Nerul West...")

    # 🚩 THE FIX: Set EVERYONE in Nerul West to use the same workspace code
    # This ensures the Desk Officer and Contractors are in the same 'virtual office'
    cursor.execute("""
        UPDATE government_officers 
        SET workspace_code = 'ERAD-1' 
        WHERE location = 'Nerul West'
    """)

    # Ensure admin_role names match the backend query casing
    cursor.execute("""
        UPDATE government_officers 
        SET admin_role = 'Contractor' 
        WHERE admin_role = 'contractor'
    """)
    
    cursor.execute("""
        UPDATE government_officers 
        SET admin_role = 'Desk_Officer' 
        WHERE admin_role = 'desk_officer'
    """)

    conn.commit()
    count = cursor.rowcount
    conn.close()
    print(f"✅ SUCCESS: {count} records updated. Workspace ERAD-1 is now synchronized.")

if __name__ == "__main__":
    fix_nerul_west_workspace()