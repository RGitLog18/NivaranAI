authpage
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AuthPage.css';

export default function AuthPage({ defaultRole = 'citizen' }) {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, error, setError } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const redirectPath = defaultRole === 'government' ? '/dashboard' : '/citizen';

  const handleGoogle = async () => {
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    const ok = await signInWithGoogle();
    if (ok) navigate(redirectPath);
    setSubmitting(false);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    if (isSignUp) {
      const result = await signUpWithEmail(email, password, name, defaultRole);
      if (result?.success) {
        setSuccessMsg('Account created! Please check your email to verify, then sign in.');
        setIsSignUp(false);
      }
    } else {
      const ok = await signInWithEmail(email, password);
      if (ok) navigate(redirectPath);
    }
    setSubmitting(false);
  };

  const icon = defaultRole === 'government' ? '🏛️' : '👤';
  const title = defaultRole === 'government' ? 'Government Portal' : 'Citizen Portal';
  const subtitle = defaultRole === 'government'
    ? 'Sign in to access the Grievance Dashboard'
    : 'Sign in to file and track your grievances';

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={toggleTheme}>
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-emblem">{icon}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        <form className="auth-form" onSubmit={handleEmailSubmit}>
          {isSignUp && (
            <div className="auth-field">
              <label>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" required />
            </div>
          )}
          <div className="auth-field">
            <label>Email <span className="req">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="auth-field">
            <label>Password <span className="req">*</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required minLength={6} />
          </div>
          <button type="submit" className="btn-auth" disabled={submitting}>
            {submitting ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button className="btn-google" onClick={handleGoogle} disabled={submitting}>
          <svg viewBox="0 0 24 24" width="20" height="20" className="google-icon">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {submitting ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="auth-toggle">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg(''); }}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        <div className="auth-footer">
          <Link to="/select-role">← Back to Role Selection</Link>
        </div>
      </div>
    </div>
  );
}