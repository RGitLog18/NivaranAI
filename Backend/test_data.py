import sqlite3

def seed_database():
    conn = sqlite3.connect("grievance.db")
    cursor = conn.cursor()

    # Sample Data for "The Revolutionary Demo"
    # Note: Using Mumbai coordinates as an example
    complaints = [
        # --- CLUSTER 1: 10 Moderate Garbage Issues (Wide Spread) ---
        # Logic: Low severity, many people
        *[(f"Citizen {i}", "9821630502", "en", "Kachra jamla ahe, please clean", "Dharavi Sector", 
           19.04 + (i*0.001), 72.85 + (i*0.001), "Ward 5", "uploads/garbage.png", "verified", "Moderate", "Sanitation", 4.2) 
          for i in range(10)],

        # --- CLUSTER 2: 2 Dangerous Potholes (Tight Cluster) ---
        # Logic: High severity, few people (This creates the Dark Red Pulse)
        ("Sakshi C", "9967586511", "mr", "Emergency: Huge pothole caused accident!", "MG Road", 
         19.0751, 72.8771, "Ward 5", "uploads/pothole.png", "verified", "Dangerous", "Roads", 9.8),
        ("Raj S", "9820012345", "en", "Very dangerous road break, bike fell down", "MG Road", 
         19.0752, 72.8772, "Ward 5", "uploads/pothole.png", "verified", "Dangerous", "Roads", 9.5),

        # --- CLUSTER 3: 5 Neutral Street Light Issues ---
        *[(f"User {i}", "9000000000", "en", "Light not working", "Andheri East", 
           19.11 + (i*0.002), 72.86 + (i*0.002), "Ward 5", "uploads/light.png", "verified", "Neutral", "Electricity", 2.1) 
          for i in range(5)]
    ]

    cursor.executemany('''
        INSERT INTO complaints (
            full_name, phone, language, text_desc, location, 
            latitude, longitude, ward_zone, image_path, status, priority, ai_category, ai_score
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ''', complaints)

    conn.commit()
    conn.close()
    print("✅ Database successfully seeded with 17 diverse complaints!")

seed_database()