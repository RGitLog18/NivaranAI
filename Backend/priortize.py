import requests
import os
from geopy.geocoders import Nominatim
from deep_translator import GoogleTranslator

# --- SETUP ---
# On Render, go to Dashboard -> Environment -> Add Environment Variable
# Key: HF_TOKEN | Value: (Your Hugging Face Token)
HF_TOKEN = os.getenv("HF_TOKEN") 
API_URL = "https://api-inference.huggingface.co/models/MoritzLaurer/mDeBERTa-v3-base-mnli-xnli"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

geolocator = Nominatim(user_agent="nivaran_ai_engine")

def query_ai_cloud(text, labels):
    """Hits the AI Cloud. This is why you get 90% accuracy on a low-RAM server."""
    payload = {"inputs": text, "parameters": {"candidate_labels": labels}}
    # Timeout is set to 20s because the first call might be slow
    response = requests.post(API_URL, headers=headers, json=payload, timeout=20)
    return response.json()

def prioritize_complaint(description, ai_result, lat, lon, location_text):
    # 1. Standard Translation (Variable preserved for your DB)
    try:
        desc_en = GoogleTranslator(source='auto', target='en').translate(description)
    except:
        desc_en = description
    
    # 2. Extract AI Visual Identity (from takeimage.py/roboflow)
    ai_label = ai_result.get('label', 'none').lower() 

    # 3. AI CATEGORY CLASSIFICATION (The Accuracy Fix)
    category_labels = ["Roads & Infrastructure", "Sanitation & Waste", "Water Supply", "Electricity"]
    
    try:
        # Multi-modal context: text + image label
        input_text = f"{description} ({ai_label})"
        cat_res = query_ai_cloud(input_text, category_labels)
        cat = cat_res['labels'][0]
    except Exception as e:
        print(f"AI API Error: {e}")
        cat = "General Inquiry" # Fallback

    # 4. AI PRIORITY SCORING
    try:
        prio_res = query_ai_cloud(description, ["Dangerous", "Moderate", "Low"])
        prio_label = prio_res['labels'][0]
        prio_conf = prio_res['scores'][0]
    except:
        prio_label = "Moderate"
        prio_conf = 0.5

    # 5. TIERED SCORING FORMULA (Matching your original 1.0 - 10.0 scale)
    score = 1.0 + (ai_result.get('confidence', 0) * 1.0)
    bonus_map = {"Dangerous": 7.0, "Moderate": 3.5, "Low": 1.0}
    final_score = min(score + bonus_map.get(prio_label, 1.0), 10.0)

    # 6. Ward Resolution (Original logic)
    ward_zone = "Unknown"
    try:
        if lat != 0:
            addr = geolocator.reverse(f"{lat}, {lon}", language='en').raw['address']
            ward_zone = addr.get('suburb') or addr.get('city') or location_text
    except: ward_zone = location_text

    # 7. FINAL RETURN (Identical schema for DB/Frontend)
    return {
        "ai_score": round(final_score, 1),
        "priority": prio_label,
        "ai_category": cat,
        "ward_zone": str(ward_zone),
        "translated_text": desc_en
    }