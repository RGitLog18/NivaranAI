import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck, Search, Activity, FileText,
    Map as MapIcon, ChevronRight, MoreVertical,
    TrendingUp, Zap, Bell, User, LayoutDashboard,
    Clock, Download
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import './DeskDashboard.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useEffect } from 'react';

const getPriorityInfo = (score) => {
    if (score >= 8.0) return { label: '🚨 CRITICAL', class: 'status-tag critical' };
    if (score >= 5.0) return { label: '⚠️ HIGH', class: 'status-tag high' };
    if (score >= 3.0) return { label: '🟡 MEDIUM', class: 'status-tag medium' };
    return { label: '⚪ LOW', class: 'status-tag low' };
};


export default function DeskDashboard() {
    const navigate = useNavigate();
    const  user  = {name: "Sakshi Chavan" ,ward: "Dombivli East"} // Get real officer details
    const [chartData, setChartData] = useState([
        { day: 'Mon', val: 0 }, { day: 'Tue', val: 0 }, { day: 'Wed', val: 0 },
        { day: 'Thu', val: 0 }, { day: 'Fri', val: 0 }, { day: 'Sat', val: 0 }, { day: 'Sun', val: 0 }
    ]);

    // 1. STATE MANAGEMENT (Replacing static dummy data)
    const [complaints, setComplaints] = useState([]);
    const [metrics, setMetrics] = useState({ total_today: 0, urgent_count: "00", sla_compliance: "100%" });
    const [loading, setLoading] = useState(true);

    // 2. REAL-TIME SYNC LOGIC
    const syncDashboard = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn("No token found. Redirecting to login or using Guest Mode.");
                // navigate('/login'); // Optional: force login if security is strict
            }
            const params = {
                ward: user?.ward || localStorage.getItem('gov_ward') || "Dombivli East",
                domain: user?.admin_domain || localStorage.getItem('gov_domain') || "Roads & Infrastructure"
            };
            const config = { headers: { Authorization: `Bearer ${token}` }, params };

            const [statsRes, inboxRes, chartRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/v1/desk/dashboard-stats`, config),
                axios.get(`${import.meta.env.VITE_API_URL}/api/v1/desk/inbox`, config),
                // NEW: Fetching real trend data
                axios.get(`${import.meta.env.VITE_API_URL}/api/v1/desk/severity-trend`, config)
            ]);

            setMetrics(statsRes.data);
            setComplaints(inboxRes.data);
            setChartData(chartRes.data); // Update the chart with real DB trends
        } catch (err) {
            console.error("Dashboard Sync Error:", err);
            if (err.response?.status === 401) {
                localStorage.clear();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        syncDashboard();
    }, [user]);

    if (loading) return <div className="war-room-loader"><span>Syncing Operational Triage...</span></div>;



    return (
        <div className="desk-root bg-[#FDFDFD] min-h-screen font-sans">

            {/* --- GROWW-STYLE TOP NAV --- */}
            <nav className="desk-nav">
                <div className="nav-container">
                    <div className="nav-left">
                        <span className="logo-icon">🏛️</span>
                        <span className="logo-text">निvaran AI</span>
                        <div className="nav-tabs">
                            <button className="active">Active Triage</button>
                            <button onClick={()=>navigate('/dashboard/visualization')}>Visual Hotspots</button>
                            <button onClick={()=>navigate('/dashboard/agent-portal')}>Contractor Registry</button>
                            <button onClick={() => navigate('/dashboard/performance')}>My Performance</button>
                        </div>
                    </div>
                    <div className="nav-right">
                        <div className="icon-pills"><Bell size={18} /></div>
                        <div className="profile-pill">
                            <User size={18} />
                            <div className="profile-text">
                                <strong>{user?.name || "Officer"}</strong>
                                <small>{user?.admin_role} ({user?.admin_domain})</small>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="desk-content">
                <div className="content-grid">

                    {/* --- LEFT SECTION: STATS & INBOX (70%) --- */}
                    <div className="left-pane">
                        <header className="pane-header">
                            <h1 className="text-3xl font-black tracking-tight">Grievance Portfolio</h1>
                            <p className="text-slate-500 font-medium">
                                Administrative Domain: <span className="text-emerald-600">{user?.admin_domain}</span>
                                | Jurisdiction: <span className="font-bold">{user?.ward || "General Zone"}</span>
                            </p>
                        </header>

                        {/* QUICK STATS CARDS */}
                        <div className="metrics-row">
                            <div className="metric-card">
                                <small>TOTAL TODAY</small>
                                <h2>{metrics.total_today}</h2>
                                <div className="trend positive"><TrendingUp size={12} /> +12%</div>
                            </div>
                            <div className="metric-card">
                                <small>URGENT (8.0+)</small>
                                <h2 className="text-rose-500">{metrics.urgent_count}</h2>
                                <p className="subtext">Requires immediate action</p>
                            </div>
                            <div className="metric-card">
                                <small>TIMELINE</small>
                                {/* Visual Triage: Red if compliance is low, Emerald if high */}
                                <h2 style={{ color: parseInt(metrics.sla_compliance) < 75 ? '#F43F5E' : '#10B981' }}>
                                    {metrics.sla_compliance}
                                </h2>
                                <div className="progress-bar-small">
                                    <div
                                        className="fill"
                                        style={{
                                            width: metrics.sla_compliance,
                                            background: parseInt(metrics.sla_compliance) < 75 ? '#F43F5E' : '#10B981'
                                        }}
                                    ></div>
                                </div>
                                <p className="subtext">
                                    {parseInt(metrics.sla_compliance) > 90 ? "Excellent Efficiency" : "Immediate Action Required"}
                                </p>
                            </div>
                        </div>

                        {/* COMPLAINT INBOX TABLE */}
                        <div className="inbox-section">
                            <div className="inbox-header">
                                <h3>Complaint Inbox</h3>
                                <div className="filter-pills">
                                    <button className="active">Verified</button>
                                    <button>In-Progress</button>
                                    <button>Resolved</button>
                                </div>
                            </div>

                            <table className="desk-table">
                                <thead>
                                    <tr>
                                        <th>Complaint ID</th>
                                        <th>Location</th>
                                        <th>Severity</th>
                                        <th>Risk Label</th>
                                        <th>Assigned Unit</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {complaints.map((item) => {
                                        // 1. Get the dynamic label and class based on AI Score
                                        const prio = getPriorityInfo(item.ai_score);

                                        return (
                                            <tr key={item.id} className={`hover-row ${item.ai_score >= 8 ? 'row-critical-alert' : ''}`}>
                                                <td className="id-cell"><strong>#{item.id}</strong></td>

                                                {/* 2. Using 'location' from Geopy Reverse Geocoding */}
                                                <td className="loc-cell"><MapIcon size={14} className="inline mr-1" /> {item.location}</td>

                                                <td>
                                                    <div className="score-meter">
                                                        <span>{(item.ai_score || 0).toFixed(1)} / 10</span>
                                                    </div>
                                                </td>

                                                <td>
                                                    {/* 3. Using the AI-Verified Risk Label, not the workflow status */}
                                                    <span className={`status-tag ${prio.class}`}>
                                                        {prio.label}
                                                    </span>
                                                </td>

                                                {/* 4. Using 'contractor_id' from the auto-assignment logic */}
                                                <td className="contractor-cell">{item.contractor_id || "Awaiting Dispatch"}</td>

                                                <td><MoreVertical size={16} className="text-slate-300 cursor-pointer" /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- RIGHT SECTION: INTELLIGENCE SIDEBAR (30%) --- */}
                    <aside className="right-sidebar">

                        {/* SYSTEM HEALTH: Pulsing Animation */}
                        <div className="sidebar-widget health-card">
                            <div className="health-pulse-ring">
                                <div className="pulse-dot"></div>
                                <Zap size={24} fill="#10B981" color="#10B981" />
                            </div>
                            <h3>System Health</h3>
                            <p className="text-emerald-500 font-bold">OPTIMAL</p>
                            <small>All AI nodes active</small>
                        </div>

                        {/* SEVERITY TREND: Fills the middle space */}
                        <div className="sidebar-widget">
                            <h4>7-Day Severity Trend</h4>
                            <div className="h-32 w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <Area type="monotone" dataKey="val" stroke="#10B981" fill="#D1FAE5" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="mt-2 text-[10px] text-slate-400 font-medium">Avg risk index increased 12% this week.</p>
                        </div>

                        {/* ACTION CENTER: Big Buttons */}
                        <div className="sidebar-widget action-center">
                            <h4>Action Center</h4>
                            <div className="action-stack">
                                <button className="btn-action-main">
                                    <FileText size={18} /> Generate Intel Report
                                </button>
                                <button className="btn-action-outline">
                                    <MapIcon size={18} /> Visualize Red Zones
                                </button>
                            </div>
                        </div>

                        {/* AI ADVISOR: Prevents blank space at the bottom */}
                        <div className="sidebar-widget ai-advisor-card">
                            <div className="advisor-header">
                                <Activity size={14} /> <span>निvaran ADVISOR</span>
                            </div>
                            <p>AI suggests re-routing <strong>2 field workers</strong> to Sector 5 due to a cluster of Dangerous potholes.</p>
                        </div>

                    </aside>

                </div>
            </main>
        </div>
    );
}