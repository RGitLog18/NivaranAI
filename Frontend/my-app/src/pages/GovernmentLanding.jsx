import React, { useState, useMemo, useEffect } from 'react';
import { useComplaints } from '../context/ComplaintContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, User } from 'lucide-react';
import GrievanceMap from './Heatmap';
import './GovernmentLanding.css';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

const CATEGORIES = [
  { key: 'Roads & Infrastructure', name: 'Roads & Infra', icon: '🛣️', dbMatch: ['Roads & Infrastructure', 'Roads', 'Infrastructure'] },
  { key: 'Water Leakage', name: 'Water Leakage', icon: '💧', dbMatch: ['Water Leakage', 'Water', 'Water Supply'] },
  { key: 'Electricity', name: 'Electricity', icon: '⚡', dbMatch: ['Electricity', 'Electrical'] },
  { key: 'Garbage', name: 'Garbage', icon: '🗑️', dbMatch: ['Garbage', 'Sanitation', 'Waste', 'Sanitation & Waste'] },
];

const SIDEBAR_TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'analysis', label: 'Analysis', icon: '🔍' },
];

const TIME_FILTERS = ['Today', 'Monthly', 'Yearly'];

function filterByTime(complaints, timeFilter) {
  const now = new Date();
  return complaints.filter(c => {
    const d = new Date(c.created_at || c.date);
    if (isNaN(d)) return true;
    if (timeFilter === 'Today') {
      return d.toDateString() === now.toDateString();
    }
    if (timeFilter === 'Monthly') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (timeFilter === 'Yearly') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

function matchesCategory(complaint, category) {
  const cat = (complaint.category || '').toLowerCase();
  return category.dbMatch.some(m => cat === m.toLowerCase());
}

export default function GovernmentLanding() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [systemConfig, setSystemConfig] = useState({});
  const [loading, setLoading] = useState(true);
  
  const scope = systemConfig.administrative_scope || 'Municipal Corporation';
  const isPanchayat = scope === 'Gram Panchayat';
  
  // DYNAMIC ARCHITECT: ADMINISTRATIVE LABELS (MORNING NEWSPAPER MOULD)
  const dashboardTitle = isPanchayat ? "Gram Panchayat Morning Newspaper" : "City Intelligence Live";
  const departmentLabel = isPanchayat ? 'Our Work Units' : 'Administrative Domain';
  const officerLabel = isPanchayat ? "Field Team" : "Officer Identity";

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get("http://127.0.0.1:8000/api/v1/system/config", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSystemConfig(res.data);
      } catch (err) {
        console.error("Config Fetch Error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <div className="war-room-loader"><span>Typesetting The News...</span></div>;

  return (
    <div className="dashboard-wrapper">
      {/* --- NEWSPAPER HEADER --- */}
      <header className="newspaper-header" style={{background: '#FFFFFF', borderBottom: '8px solid #F0F9FF'}}>
        <div className="header-top">
            <span>Vol. 2026 - Digital Edition</span>
            <span><Calendar size={14} style={{verticalAlign: 'middle'}}/> {currentDate}</span>
            <span><User size={14} style={{verticalAlign: 'middle'}}/> {officerLabel}: Verified</span>
        </div>
        <h1 className="newspaper-title">{dashboardTitle}</h1>
        <div className="header-bottom" style={{borderTop: '2px solid #000', padding: '0.75rem 0', display: 'flex', justifyContent: 'center', gap: '2rem', fontWeight: 800}}>
            <span>🏛️ BODY: {scope.toUpperCase()}</span>
            <span>👤 USER: {user?.name?.toUpperCase() || user?.email?.toUpperCase()}</span>
            <button onClick={() => { logout(); navigate('/login'); }} style={{background: 'none', border: 'none', color: '#3b82f6', fontWeight: 900, cursor: 'pointer'}}>LOGOUT</button>
        </div>
      </header>

      <div className="newspaper-body" style={{background: '#FFFFFF'}}>
        {/* --- MAIN COLUMN --- */}
        <main className="top-story" style={{padding: '3rem', borderRight: '2px solid #F0F9FF'}}>
            <div className="headline-wrap">
                <span className="severity-badge badge-dangerous">Sovereign Briefing: Top Priority</span>
                <h2 className="headline-large">Welcome Back to the {isPanchayat ? 'Work Units' : 'Desk'}.</h2>
            </div>
            
            <div className="morning-overview" style={{marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem'}}>
                {CATEGORIES.map(cat => (
                    <div 
                        key={cat.key} 
                        className="bento-item selectable-item" 
                        style={{border: '4px solid #F0F9FF', padding: '2rem', background: '#FFFFFF', textAlign: 'left'}}
                        onClick={() => navigate(`/dashboard/${cat.key}`)}
                    >
                        <div className="icon-wrapper" style={{fontSize: '3rem', marginBottom: '1rem'}}>{cat.icon}</div>
                        <h3 style={{fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem'}}>{cat.name}</h3>
                        <p style={{color: '#64748b', fontSize: '0.9rem'}}>Access {departmentLabel} and start the Morning Triage.</p>
                        <div style={{marginTop: '1.5rem', color: '#10b981', fontWeight: 900, fontSize: '0.8rem'}}>ACCESS DESK →</div>
                    </div>
                ))}
            </div>

            {/* TRUST LOOP: VISUAL AUDIT */}
            <section className="visual-audit-section" style={{marginTop: '4rem', paddingTop: '3rem', borderTop: '4px solid #F0F9FF'}}>
                <h3 className="sidebar-title" style={{fontSize: '2.5rem'}}>Trust Loop: Resolved Stories</h3>
                <div className="audit-grid" style={{marginTop: '2rem'}}>
                    <div className="audit-item">
                        <h4 style={{fontFamily: 'Playfair Display', fontSize: '1.3rem', marginBottom: '1rem'}}>Market Area: Sanitation Success</h4>
                        <div className="audit-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
                            <div className="audit-card" style={{border: '2px solid #F0F9FF', padding: '1rem'}}>
                                <img src="http://127.0.0.1:8000/uploads/resolutions/test_before.jpg" alt="Before" className="audit-img" style={{width: '100%', height: '250px', objectFit: 'cover'}} />
                                <div className="audit-label" style={{marginTop: '1rem', fontWeight: 900, color: '#64748b'}}>BEFORE: COMMUNITY NEGLECT</div>
                            </div>
                            <div className="audit-card" style={{border: '4px solid #10b981', padding: '1rem'}}>
                                <img src="http://127.0.0.1:8000/uploads/resolutions/test_fixed.jpg" alt="After" className="audit-img" style={{width: '100%', height: '250px', objectFit: 'cover'}} />
                                <div className="audit-label" style={{marginTop: '1rem', fontWeight: 900, color: '#10b981'}}>AFTER: GOVERNANCE TRUTH</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>

        {/* --- SIDEBAR --- */}
        <aside className="newspaper-sidebar" style={{background: '#F0F9FF', padding: '3rem'}}>
            <div className="briefing-box leaderboard-widget" style={{background: '#FFFFFF', padding: '2rem', border: '4px solid #3b82f6'}}>
                <h3 className="sidebar-title" style={{fontSize: '1.5rem', border: 'none', marginBottom: '1.5rem'}}>Worker Leaderboard</h3>
                <div className="leaderboard-item">
                    <span className="worker-rank">#1</span>
                    <div className="worker-info">
                        <strong>Rahul Patil ({isPanchayat ? 'Field Team Lead' : 'Senior Officer'})</strong>
                        <p>4 Verified Fixes this week</p>
                    </div>
                    <div className="score-badge">EXCEPTIONAL</div>
                </div>
            </div>

            <div className="briefing-box" style={{background: '#FFFFFF', padding: '2rem', marginTop: '2rem', border: '2px solid #e2e8f0'}}>
                <h3 className="sidebar-title" style={{fontSize: '1.5rem', border: 'none'}}>Morning Briefing</h3>
                <p style={{fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6'}}>
                    Today, the AI Sovereign Pipeline has detected <strong>14 new verified grievances</strong>.
                    Immediate attention is required in the <strong>East Sector</strong>.
                </p>
                <div className="ai-truth-tag" style={{position: 'static', marginTop: '1rem', textAlign: 'center'}}>📍 TRUTH VERIFIED BY AI</div>
            </div>
        </aside>
      </div>
    </div>
  );
}