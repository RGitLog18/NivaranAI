import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// 1. IMPORT PAGES
import ManualPage from "./pages/ManualPage";
import LoginPage from "./pages/LoginPage";
import CitizenSignup from "./pages/CitizenSignup";
import CitizenLogin from "./pages/CitizenLogin";
import GovSignup from "./pages/GovSignup";
import CitizenComplaint from "./pages/CitizenComplaint";
import AdminOnboarding from "./pages/AdminOnboarding";
import { Layout } from './components/Layout.jsx';

// --- ROLE-SPECIFIC COMPONENTS ---
import { Dashboard } from './pages/Dashboard.jsx'; // For Admin
import DeskDashboard from './pages/DeskDashboard.jsx'; // For Desk Officer / Contractor

import Visualization from './pages/Visualization.jsx';
import OfficersPage from './pages/OfficersPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import EmailPage from './pages/EmailPage.jsx';

import SettingsPage from './pages/SettingsPage.jsx';
import MyPerformance from './pages/MyPerformance.jsx';

import ProtectedRoute from "./components/ProtectedRoute";
import CitizenProtectedRoute from "./components/CitizenProtectedRoute";
import ContractorPortal from './pages/ContractorPortal.jsx';
import ContractorRegistry from './pages/ContractorRegistry.jsx';

/**
 * REVOLUTIONARY DEVELOPER: THE DASHBOARD SWITCHER
 * This component "moulds" the main dashboard based on the user's role.
 */
/**
 * SOVEREIGN DASHBOARD SWITCHER
 * Purpose: Dynamically "moulds" the dashboard based on the mapped Admin Role.
 * Logic: 
 * - 'Admin' -> Full Administrative Control (Statistics, Executive Summary)
 * - 'Desk_Officer' -> Operational Triage (Inbox, Severity Trends)
 * - 'Contractor' -> Field Mission Management (Job Cards, Proof Uploads)
 */
const DashboardSwitcher = () => {
  const { user, loading } = useAuth();

  // 1. Loading State
  if (loading) return <div className="p-20 text-center font-bold">Syncing Authority...</div>;

  // 2. Auth State Check
  if (!user) return <Navigate to="/login" replace />;

  console.log("🚀 Switcher Logic Triggered. Admin Role:", user.admin_role);

  try {
    // 3. Admin Mapping
    if (user.admin_role === 'Admin') {
      return <Dashboard />;
    }

    // 4. Contractor Mapping
    if (user.admin_role === 'Contractor') {
      return <ContractorPortal />;
    }

    // 5. Default Fallback (Desk Officer)
    // If this results in a blank screen, it means <DeskDashboard /> itself is crashing.
    return <DeskDashboard />;

  } catch (error) {
    console.error("💥 Dashboard Component Crash:", error);
    return (
      <div className="p-20 text-center">
        <h1 className="text-red-600 font-bold">Dashboard UI Error</h1>
        <p>The role was identified as {user.admin_role}, but the page failed to render.</p>
      </div>
    );
  }
};
export const router = createBrowserRouter([
  { path: '/', element: <ManualPage /> },
  { path: '/login', element: <LoginPage defaultRole="government" /> },
  { path: '/citizen-login', element: <CitizenLogin defaultRole="citizen" /> },
  { path: '/gov-signup', element: <GovSignup /> },
  { path: '/admin-onboarding', element: <AdminOnboarding /> },
  { path: '/citizen-signup', element: <CitizenSignup /> },

  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRole="government">
      </ProtectedRoute>
    ),
    children: [
      {
        element: <Layout />,
        children: [
          // THE "CRACK": index route now uses the Switcher
          { index: true, element: <DashboardSwitcher /> },
          { path: 'visualization', element: <Visualization /> },
          { path: 'officers', element: <OfficersPage /> },
          { path: 'statistics', element: <StatisticsPage /> },
          { path: 'email', element: <EmailPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'contractors', element: <ContractorPortal /> },
          { path: 'agent-portal', element: <ContractorRegistry /> },
          { path: 'performance', element: <MyPerformance /> }
        ]
      }
    ],
  },

  {
    path: '/citizen',
    element: (
      <CitizenProtectedRoute>
        <CitizenComplaint />
      </CitizenProtectedRoute>
    ),
  },
  // Ensure your root path also redirects if logged in
  {
    path: '/',
    element: <ManualPage />, // Or a component that checks role and redirects
  }
]);