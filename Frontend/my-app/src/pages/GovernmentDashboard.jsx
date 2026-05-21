import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GovernmentDashboard.css';
import Heatmap from './Heatmap';

export default function GovernmentDashboard() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic View Logic
  const [showMap, setShowMap] = useState(false);

  // Identity: Pulling from Storage
  const officerWard = localStorage.getItem("gov_ward") || "Ward 5";

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const complaintsRes = await axios.get(`http://127.0.0.1:8000/get-complaints?ward=${officerWard}&category=${category}`, config);

      setComplaints(complaintsRes.data || []);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [category]);

  const getPrioBadge = (score) => {
    if (score >= 7.5) return <span className="badge-sovereign urgent">🔴 CRITICAL RISKS</span>;
    if (score >= 4.0) return <span className="badge-sovereign elevated">🟡 ELEVATED</span>;
    return <span className="badge-sovereign stable">🟢 STABLE</span>;
  };

  if (loading) return <div className="loader">Fusing AI Intelligence...</div>;

  return (
    <div className="dashboard-wrapper digital-sunlight">
      <header className="dash-header sovereign-border">
        <button className="btn-return" onClick={() => navigate('/gov-landing')}>← RETURN TO COMMAND</button>
        <h2>{category} Sovereign Intelligence Report</h2>
        <span className="location-tag">📍 JURISDICTION: {officerWard}</span>
        {/* Interactive Handshake Trigger */}
        <button 
          className="btn-visualization" 
          onClick={() => setShowMap(true)}
          style={{
            background: 'var(--ds-emerald)', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '6px', 
            fontWeight: '600', 
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          🗺️ Visualization
        </button>
      </header>

      {showMap ? (
         <div className="full-screen-map-overlay" style={{ flex: 1, position: 'relative', minHeight: '60vh' }}>
            <Heatmap />
            {/* Back Navigation Overlay Button */}
            <button 
              onClick={() => setShowMap(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                zIndex: 999,
                background: 'var(--ds-slate)',
                color: 'var(--ds-white)',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
              }}
            >
              Return to Command Board
            </button>
         </div>
      ) : (
        <div className="table-section">
          <table className="triage-table">
            <thead>
              <tr><th>INTEL CATEGORY</th><th>CITIZEN IDENTITY</th><th>RISK SCORE</th><th>COORDINATES</th><th>SITUATION EVIDENCE</th></tr>
            </thead>
            <tbody>
              {complaints.map(item => (
                <tr key={item.id}>
                  <td>{getPrioBadge(item.ai_score)}</td>
                  <td>{item.full_name}</td>
                  <td>{item.ai_score.toFixed(1)}</td>
                  <td>{item.location}</td>
                  <td><button className="btn-view" onClick={() => window.open(`http://127.0.0.1:8000/${item.image_path}`)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}