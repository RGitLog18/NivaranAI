import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function Heatmap() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      const token = localStorage.getItem('token');
      const officerWard = localStorage.getItem("gov_ward") || "Ward 5";
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        // Default Logic: On mount, automatically fetch data for category "Roads & Infrastructure".
        // The API explicitly handles "Roads" via fuzzy match in the Backend Guard.
        const res = await axios.get(`http://127.0.0.1:8000/get-heatmap?ward=${officerWard}&category=Roads & Infrastructure`, config);
        setClusters(res.data?.clusters || []);
      } catch (err) {
        console.error("Failed to load Reflector Data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmapData();
  }, []);

  const center = clusters.length > 0 ? [clusters[0].lat, clusters[0].lon] : [19.0760, 72.8777];

  if (loading) return <div className="loader" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Initializing Visual Reflector...</div>;

  return (
    <div style={{ height: "100%", width: "100%", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        {/* Aesthetic standard: CartoDB Positron for crisp place names */}
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        
        {clusters.map((cluster, idx) => {
          // Bivariate Intelligence
          const isHighRisk = cluster.severity >= 7.5;
          // Emerald Green and Rose Red
          const nodeColor = isHighRisk ? '#e11d48' : '#10b981';

          return (
            <CircleMarker 
              key={idx}
              center={[cluster.lat, cluster.lon]}
              // Marker Size is mapped to count (Impact)
              radius={10 + (cluster.count * 5)} 
              // Color is mapped to severity (Risk)
              pathOptions={{ 
                fillColor: nodeColor, 
                color: nodeColor, 
                fillOpacity: 0.6,
                // Bloom Effect: High-severity hotspots must pulse
                className: isHighRisk ? 'visual-bloom-pulse' : ''
              }}
            >
              <Popup>
                <strong>AI Intelligence Alert</strong><br/>
                Risk (Severity): {cluster.severity ? cluster.severity.toFixed(1) : 0}/10<br/>
                Impact (Volume): {cluster.count} Grievances
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}