import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../lib/Firebase';
import { validateUID } from '../utils/uidValidation';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Added: Manually set a user from the Python Backend response
  // AuthContext.jsx
  const setLocalUser = (userData, token = null) => {
    // FIX: Trust the backend role explicitly. 
    // Do NOT use || 'citizen' here if it creates a mismatch.
    const detectedRole = userData.role || (userData.admin_role ? 'government' : 'citizen');
    
    const authenticatedUser = {
      ...userData,
      role: userData.role // Use exactly what the database sent
    };

    if (token) localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(authenticatedUser));

    // This will now log the REAL truth from the DB
    console.log("⚓ Final Role Lock:", authenticatedUser.role);
    setUser(authenticatedUser);
  };
  // In AuthContext.jsx
  useEffect(() => {
    const rehydrateIdentity = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, {
          headers: { Authorization: `Bearer ${token.trim()}` }
        });

        if (res.data) {
          // ✅ THE FIX: Use res.data.role directly from the backend
          // Do NOT hardcode "government" here anymore.
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
          console.log("⚓ Identity Anchored as:", res.data.role);
        }
      } catch (err) {
        console.error("Session sync failed");
        logout();
      } finally {
        setLoading(false);
      }
    };

    rehydrateIdentity();
  }, []);

  // Alias: 'login' is the same as setLocalUser — called from LoginPage after OTP verify
  const login = setLocalUser;

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/profile`, {
        headers: { Authorization: `Bearer ${token.trim()}` }
      });

      if (res.data) {
        // ✅ THE FIX: Force the role to 'government' if they have an admin_role
        // This ensures ProtectedRoute sees 'government' and doesn't redirect to /citizen
        const authenticatedUser = {
          ...res.data,
          role: res.data.admin_role ? 'government' : res.data.role
        };

        setUser(authenticatedUser);
        localStorage.setItem('user', JSON.stringify(authenticatedUser));
        console.log("⚓ Identity Anchored as:", authenticatedUser.role);
      }
    } catch (err) {
      console.error("Session sync failed");
      logout(); // Wipe stale sessions
    } finally {
      setLoading(false);
    }
  };


  // SOVEREIGN RE-HYDRATION: Trigger on page reload
  useEffect(() => {
    fetchProfile();
  }, []);

  const signUpWithEmail = async (email, password, name, role = 'citizen', uidNumber) => {
    setError('');
    if (uidNumber && !validateUID(uidNumber)) {
      const msg = "Invalid 12-digit UID. Please check your Aadhaar number.";
      setError(msg);
      return { success: false, error: msg };
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user);
      return { success: true };
    } catch (err) {
      let friendlyError = err.message;
      if (err.code === 'auth/email-already-in-use') {
        friendlyError = "This email is already registered.";
      }
      setError(friendlyError);
      return { success: false, error: friendlyError };
    }
  };

  const signInWithEmail = async (email, password) => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    // FIX: Wipe everything so the next person starts fresh
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    window.location.href = "/";
  };

  const value = {
    user,
    setLocalUser,
    fetchProfile,
    login,       // Alias exposed for LoginPage.jsx
    loading,
    error,
    setError,
    signUpWithEmail,
    signInWithEmail,
    logout,
    isAuthenticated: !!user,
    isGovernment: user?.role === 'government'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
