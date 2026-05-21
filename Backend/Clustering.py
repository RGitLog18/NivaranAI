from sklearn.cluster import DBSCAN
import numpy as np

def get_clusters(complaints):
    """Aggregates individual reports into physical hotspots"""
    if not complaints: return []

    # 1. Extract standard coordinates
    coords = np.array([[c['latitude'], c['longitude']] for c in complaints])
    
    # 2. Density Check (Radius ~ 100m)
    db = DBSCAN(eps=0.001, min_samples=1).fit(coords)
    labels = db.labels_

    clusters = []
    for label in set(labels):
        group = [complaints[i] for i, l in enumerate(labels) if l == label]
        
        avg_lat = sum(p['latitude'] for p in group) / len(group)
        avg_lon = sum(p['longitude'] for p in group) / len(group)
        peak_severity = max(p['ai_score'] for p in group)
        
        # Color Triage for Heatmap
        if peak_severity >= 8.0: color = "#EF4444" # Red
        elif peak_severity >= 5.0: color = "#F59E0B" # Orange
        else: color = "#10B981" # Green

        clusters.append({
            "latitude": avg_lat,
            "longitude": avg_lon,
            "ai_score": peak_severity,
            "count": len(group),
            "color": color,
            "ward_zone": group[0]['ward_zone']
        })
    
    return clusters