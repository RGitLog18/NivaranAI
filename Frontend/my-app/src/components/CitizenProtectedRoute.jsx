import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CitizenProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  // 1. CRITICAL: While rehydrateIdentity is talking to the DB, show NOTHING.
  // This prevents the Citizen Form from "flashing" on the screen.
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // 2. If the backend responded and confirmed this is an Official/Government user
  if (isAuthenticated && (user?.role === 'government' || user?.admin_role)) {
    console.log("🚀 Ejecting Government User to Dashboard...");
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Only if they are a guest or a confirmed citizen, show the form
  return children;
}