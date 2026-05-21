import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="p-20 text-center">Verifying Handshake...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // ✅ LOGIC: If I have an admin_role (Admin/Desk_Officer/Contractor), 
  // I am officially a 'government' user.
  const effectiveRole = user?.admin_role ? 'government' : user?.role;
  console.log("Effective Role:", effectiveRole);

  if (allowedRole && effectiveRole !== allowedRole) {
    // If we are here, it means a citizen tried to enter the dashboard
    // OR an officer tried to enter a citizen route.
    return <Navigate to={effectiveRole === 'government' ? "/dashboard" : "/citizen"} replace />;
  }

  return children ? children: <Outlet />;
}

