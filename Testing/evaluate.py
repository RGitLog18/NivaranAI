import pandas as pd
import requests
import time
import sys
import os
from sklearn.metrics import classification_report, accuracy_score

# Add Backend folder to path to directly test the AI logic locally
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Backend')))
# pyrefly: ignore [missing-import]
from priortize import prioritize_complaint

# 1. SETUP
API_URL = "https://nivaran-ai.vercel.app/api/citizen/submit-complaint" # Old External API route
CSV_FILE = "testdata.csv"

df = pd.read_csv(CSV_FILE)
results_cat = []
results_prio = []
latencies = []

print(f"🚀 Starting Nivaran AI Evaluation (4 Classes: Roads, Sanitation, Water, Electricity)")

# 2. RUN TEST
for index, row in df.iterrows():
    # Sending exactly what your frontend sends
    payload = {
        "full_name": "Test Bot",
        "phone": "9999999999",
        "description": row['description'],
        "location": "Test Location",
        "latitude": 19.0330,
        "longitude": 73.0130
    }
    
    try:
        start = time.time()
        
        # Test directly against internal logic bypassing external network issues
        mock_ai_result = {"label": "none", "confidence": 0.0}
        data = prioritize_complaint(
            description=payload["description"],
            ai_result=mock_ai_result,
            lat=payload["latitude"],
            lon=payload["longitude"],
            location_text=payload["location"]
        )
        
        latency = time.time() - start
        
        # Mapping API response to our lists
        # Use data.get('ai_category') or whatever your API returns
        results_cat.append(data.get('ai_category', 'Unknown'))
        results_prio.append(data.get('priority', 'Unknown'))
        latencies.append(latency)
        
        print(f"[{index+1}/{len(df)}] Category: {data.get('ai_category')} | Priority: {data.get('priority')}")
    except Exception as e:
        print(f"❌ Error at row {index}: {e}")
        results_cat.append("Error")
        results_prio.append("Error")

# 3. GENERATE PAPER METRICS
print("\n" + "="*40)
print("📊 RESEARCH PAPER RESULTS")
print("="*40)

print("\n[1. Department Classification (NLP Accuracy)]")
print(classification_report(df['actual_category'], results_cat))

print("\n[2. Priority Scoring Accuracy]")
print(classification_report(df['actual_priority'], results_prio))

avg_latency = sum(latencies)/len(latencies)
print(f"\n[3. System Performance]")
print(f"Average Response Time: {avg_latency:.2f} seconds")