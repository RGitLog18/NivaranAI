import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './RoleSelection.css';

export default function RoleSelection() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="role-page">
      <nav className="role-nav">
        <div className="role-nav-brand" onClick={() => navigate('/')}>
          <span>🏛️</span>
          <span>Grievance Management System</span>
        </div>
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </nav>

      <div className="role-container">
        <h1 className="role-heading">Select Your Role</h1>
        <p className="role-subtext">Choose how you want to access the platform</p>

        <div className="role-cards">
          <div className="role-option citizen-option" onClick={() => navigate('/citizen-login')}>
            <div className="role-option-icon">👤</div>
            <h2>Citizen</h2>
            <p>File and track public grievances in your area</p>
            <ul>
              <li>Submit complaints with evidence</li>
              <li>Track status updates</li>
              <li>Multilingual support</li>
            </ul>
            <div className="role-option-cred">Requires: Unique Identity Number</div>
            <button className="role-option-btn citizen-btn">Continue as Citizen →</button>
          </div>

          <div className="role-option gov-option" onClick={() => navigate('/login')}>
            <div className="role-option-icon">🏛️</div>
            <h2>Government Official</h2>
            <p>Manage and resolve public complaints</p>
            <ul>
              <li>Dashboard with analytics</li>
              <li>Update complaint statuses</li>
              <li>AI-powered insights</li>
            </ul>
            <div className="role-option-cred">Requires: Official Gov. Credentials</div>
            <button className="role-option-btn gov-btn">Continue as Official →</button>
          </div>
        </div>

        <div className="role-back">
          <a onClick={() => navigate('/')}>← Back to Home</a>
        </div>
      </div>
    </div>
  );
}
