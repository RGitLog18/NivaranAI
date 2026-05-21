import React, { createContext, useContext, useState } from 'react';
import { mockUser } from '../data/mockData.js';

const AppContext = createContext(undefined);

export function AppProvider({ children }) {
  const [user] = useState(mockUser);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [viewedComplaints, setViewedComplaints] = useState(new Set());
  const [generatedReports, setGeneratedReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);

  const markComplaintAsViewed = (complaintId) => {
    setViewedComplaints(prev => new Set([...prev, complaintId]));
  };

  const generateReport = (complaint) => {
    const newReport = {
      id: `R${Date.now()}`,
      complaintId: complaint.id,
      complaint,
      generatedAt: new Date().toISOString()
    };
    setGeneratedReports(prev => [...prev, newReport]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        selectedComplaint,
        setSelectedComplaint,
        viewedComplaints,
        markComplaintAsViewed,
        generatedReports,
        generateReport,
        selectedReport,
        setSelectedReport,
        showTutorial,
        setShowTutorial
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}