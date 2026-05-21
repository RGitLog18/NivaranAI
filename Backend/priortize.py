from textblob import TextBlob
from deep_translator import GoogleTranslator
from geopy.geocoders import Nominatim
import os

geolocator = Nominatim(user_agent="nivaran_ai_engine")

def prioritize_complaint(description, ai_result, lat, lon, location_text):
    """Refined Intelligence: Validates if description is relevant to the issue."""
    
    # 1. Translation & Normalization
    try:
        desc_en = GoogleTranslator(source='auto', target='en').translate(description).lower()
    except:
        desc_en = description.lower()
    
    # 2. Extract AI Visual Identity
    ai_label = ai_result.get('label', 'none').lower() # e.g., 'pothole'
    
    # 3. Define Keywords
    # We look for words that prove the user is actually talking about a grievance
    issue_keywords = ["pothole", "garbage", "waste", "road", "leak", "pipe", "wire", "electric", "drain"]
    risk_keywords = ["danger", "accident", "emergency", "severe", "critical", "deadly", "injury"]

    # --- THE RELEVANCE CHECK ---
    # Is the user actually describing an infrastructure issue?
    is_meaningful = any(word in desc_en for word in issue_keywords)
    # Does the text mention danger?
    has_risk_words = any(word in desc_en for word in risk_keywords)

    # 4. TIERED SCORING FORMULA
    # Base: Minimum 1.0, Max 2.0 based on AI Vision certainty
    score = 1.0 + (ai_result.get('confidence', 0) * 1.0)

    if is_meaningful and has_risk_words:
        # ✅ CASE: "Danger Pothole" (High Priority)
        urgency_bonus = 7.0
        prio_label = "Dangerous"
    elif is_meaningful:
        # ⚠️ CASE: "Pothole" (Standard Priority)
        urgency_bonus = 3.5
        prio_label = "Moderate"
    elif has_risk_words:
        # 🚩 CASE: "Dangersakshi" (Urgency without context = Low Priority)
        # We penalize the score because the text doesn't describe the issue
        urgency_bonus = 1.5
        prio_label = "Low"
    else:
        # ⚪ CASE: Meaningless text
        urgency_bonus = 0.5
        prio_label = "Neutral"

    final_score = min(score + urgency_bonus, 10.0)

    # 5. Ward Resolution (unchanged)
    ward_zone = "Unknown"
    try:
        if lat != 0:
            addr = geolocator.reverse(f"{lat}, {lon}", language='en').raw['address']
            ward_zone = addr.get('suburb') or addr.get('city') or location_text
    except: ward_zone = location_text

    # 6. Categorization logic (unchanged)
    if "pothole" in ai_label or "road" in desc_en: cat = "Roads & Infrastructure"
    elif "garbage" in ai_label or "waste" in desc_en: cat = "Sanitation & Waste"
    else: cat = "General Inquiry"

    return {
        "ai_score": round(final_score, 1),
        "priority": prio_label,
        "ai_category": cat,
        "ward_zone": str(ward_zone),
        "translated_text": desc_en
    }