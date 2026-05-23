import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Clock, Activity, MapPin, 
  Camera, AlertCircle, ChevronRight, UploadCloud, Loader2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import './ContractorPortal.css';

export default function ContractorPortal() {
  const {user}  = useAuth(); 
  const [complaintSections, setComplaintSections] = useState({
    assigned: [],
    current: [],
    resolved: []
  });
  const [activeTab, setActiveTab] = useState('current');
  const [selectedMission, setSelectedMission] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use the specific 8000 port where your status_update.py server runs
  const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

  useEffect(() => {
    if (user?.email) {
      fetchDashboard();
    }
  }, [user]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      // Fetching from the endpoint that categorizes by status in government.db/grievance.db logic
      const res = await axios.get(`${API_BASE}/contractor-dashboard/${encodeURIComponent(user.email)}`);
      
      // Update state with categorized data: res.data = { assigned: [], current: [], resolved: [] }
      setComplaintSections(res.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to sync missions with central registry");
    } finally {
      setLoading(false);
    }
  };

  // Get the list for the currently selected tab
  const currentDisplayList = complaintSections[activeTab] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  return (
    <div className="agent-root">
      {/* Top Header Section */}
      <header className="agent-header">
        <div className="header-content">
          <h1 className="text-2xl font-bold text-slate-800">Mission Hub</h1>
          <p className="text-sm text-slate-500">{user?.name} • Authorized Contractor</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-val text-emerald-500">
              {complaintSections.resolved.length}
            </span>
            <span className="stat-lbl">Resolved</span>
          </div>
        </div>
      </header>

      {/* Metrics Bar */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="lbl">To Do</span>
          <span className="val">{complaintSections.assigned.length}</span>
        </div>
        <div className="metric-card highlighted">
          <span className="lbl">Active</span>
          <span className="val">{complaintSections.current.length}</span>
        </div>
        <div className="metric-card">
          <span className="lbl">Success</span>
          <span className="val">
            {complaintSections.resolved.length > 0 
              ? Math.round((complaintSections.resolved.length / 
                (complaintSections.assigned.length + complaintSections.current.length + complaintSections.resolved.length)) * 100) 
              : 0}%
          </span>
        </div>
      </div>

      {/* Navigation Tabs - Dynamically Switch Sections */}
      <nav className="mission-nav">
        <button 
          className={activeTab === 'assigned' ? 'active' : ''} 
          onClick={() => setActiveTab('assigned')}
        >
          Assigned ({complaintSections.assigned.length})
        </button>
        <button 
          className={activeTab === 'current' ? 'active' : ''} 
          onClick={() => setActiveTab('current')}
        >
          Dashboard ({complaintSections.current.length})
        </button>
        <button 
          className={activeTab === 'resolved' ? 'active' : ''} 
          onClick={() => setActiveTab('resolved')}
        >
          Resolved ({complaintSections.resolved.length})
        </button>
      </nav>

      {/* Main List Display */}
      <main className="mission-list">
        <AnimatePresence mode='wait'>
          {currentDisplayList.length > 0 ? (
            currentDisplayList.map(mission => (
              <motion.div 
                key={mission.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="mission-card cursor-pointer"
                onClick={() => setSelectedMission(mission)}
              >
                <div className="mission-info">
                  <div className="flex items-center gap-2">
                    <div className={`status-dot ${mission.status}`} />
                    <h3 className="font-semibold">{mission.ai_category}</h3>
                  </div>
                  <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin size={12} /> {mission.location}
                  </p>
                </div>
                <ChevronRight className="text-slate-300" />
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="empty-state py-20 text-center"
            >
              <Activity className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400">No complaints found in {activeTab} section.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mission Detail Overlay (Matches Video UI) */}
      <AnimatePresence>
        {selectedMission && (
          <motion.div 
            className="mission-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="overlay-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <button className="close-btn" onClick={() => setSelectedMission(null)}>×</button>
              
              <div className="success-check mb-6">
                <CheckCircle size={64} color="#10b981" />
              </div>

              <h2 className="text-center text-xl font-bold text-slate-800 mb-2">
                Mission Details
              </h2>
              <p className="text-center text-slate-500 mb-8">{selectedMission.ai_category}</p>
              
              <div className="photo-audit">
                <div className="photo-box">
                  <span className="photo-tag">BEFORE</span>
                  {selectedMission.image_path ? (
                     <img src={`http://${import.meta.env.VITE_API_URL}/${selectedMission.image_path}`} alt="Before" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="photo-placeholder"><Camera size={24} /> No Image</div>
                  )}
                </div>
                <div className="photo-box active border-2 border-dashed border-emerald-400">
                  <span className="photo-tag">AFTER</span>
                  {selectedMission.status === 'resolved' ? (
                     <img src={`http://${import.meta.env.VITE_API_URL}/${selectedMission.resolution_image_path}`} alt="After" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="photo-placeholder"><UploadCloud size={24} /> Ready for upload</div>
                  )}
                </div>
              </div>

              <div className="location-footer bg-slate-50 p-4 rounded-xl flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <MapPin size={20} />
                </div>
                <p className="text-sm font-medium text-slate-700">{selectedMission.location}</p>
              </div>

              <div className="action-buttons flex flex-col gap-3">
                {selectedMission.status !== 'resolved' && (
                  <>
                    <button className="btn-upload flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-transform">
                      <UploadCloud size={20}/> Upload Resolution Proof
                    </button>
                    <button className="btn-report py-4 bg-slate-100 text-slate-600 rounded-xl font-semibold">
                      Report Accessibility Issue
                    </button>
                  </>
                )}
                <button 
                  className="py-4 bg-slate-800 text-white rounded-xl font-bold"
                  onClick={() => setSelectedMission(null)}
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}