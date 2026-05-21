import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// import { cn } from '../../components/ui/utils';

// --- ANIMATED KEYWORDS FOR THE LEFT PANEL ---
const KEYWORDS = [
  "Sovereign AI", "Zero-Friction", "Automated Triage",
  "Verified Ground Truth", "Smart Governance", "Secure Handshake"
];

export default function CitizenSignup() {
  const navigate = useNavigate();

  // --- PRESERVED LOGIC STATES ---
  const [step, setStep] = useState('verification');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', uid_number: '', password: '', confirmPassword: '',
  });

  // --- PRESERVED EFFECTS ---
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // --- PRESERVED HANDLERS (EXACTLY AS PER YOUR LOGIC) ---
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!form.email || !form.name) {
      setError('Required fields missing'); return;
    }
    setSubmitting(true); setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}:8000/api/citizen/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), name: form.name.trim(), role: 'citizen', is_signup: false }),
      });
      if (!response.ok) throw new Error('Failed to send OTP.');
      setOtpSent(true); setOtpTimer(60);
      setSuccessMsg('Code sent to your email.');
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const { login } = useAuth();

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}:8000/api/citizen/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), code: otp.trim() }),
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error('Invalid code');

      if (data.status === 'success') {
        login(data.user, data.token); // Use your AuthContext login
        setSuccessMsg('Identity Verified! Entering Portal...');
        setTimeout(() => navigate('/citizen'), 1500);
      }

      setIsVerified(true); setStep('details');
      setSuccessMsg('Email verified!');
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError('Passwords mismatch');
    setSubmitting(true);
    try {
      const dbResponse = await fetch(`${import.meta.env.VITE_API_URL}:8000/api/citizen/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, uid_number: form.uid_number, password: form.password }),
      });

      const data = await dbResponse.json();

      if (!dbResponse.ok) {
        // This will help you debug 422 errors specifically
        console.error("Validation Error Details:", data.detail);
        throw new Error(data.detail[0]?.msg || 'Registration failed');
      }
      setSuccessMsg('Account created! Redirecting...');
      setTimeout(() => navigate('/citizen-login'), 2000);
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  return (
    // --- THE FULL SCREEN OVERLAY ---
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 1. THE BLURRED BACKGROUND (Manual Page behind it) */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-lg"
        onClick={() => navigate('/')} // Close on click outside
      />

      {/* 2. THE CENTERED AUTH CARD */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-white rounded-[32px] overflow-hidden flex flex-col md:flex-row min-h-[550px] shadow-2xl"
      >
        {/* CLOSE BUTTON */}
        <button onClick={() => navigate('/')} className="absolute top-6 right-6 z-50 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
          <X size={24} />
        </button>

        {/* LEFT PANEL: EMERALD BRANDING + ANIMATING KEYWORDS */}
        <div className="md:w-1/2 bg-[#10B981] p-12 flex flex-col justify-center items-center text-center text-white relative overflow-hidden">
          {/* Breathing Keywords (Background layer) */}
          {KEYWORDS.map((word, i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.1, 0.4, 0.1], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.8 }}
              className="absolute text-emerald-300/30 font-bold whitespace-nowrap pointer-events-none"
              style={{
                top: `${15 + (i * 12)}%`,
                left: i % 2 === 0 ? '10%' : 'auto',
                right: i % 2 !== 0 ? '10%' : 'auto',
                fontSize: '1.2rem'
              }}
            >
              {word}
            </motion.span>
          ))}

          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-4 leading-tight">Simple, Secure<br />Governance.</h2>
            <p className="text-emerald-50 text-sm opacity-90 max-w-[280px]">
              Empowering citizens with seamless digital services and transparent governance.
            </p>
            {/* MTF style accent */}
            <div className="mt-12 flex flex-col items-center">
              <div className="w-10 h-1 bg-white mb-2 rounded-full opacity-50" />
              <span className="font-black tracking-[0.3em] text-sm">निvaran</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: THE FORM */}
        <div className="md:w-1/2 p-10 md:p-14 bg-white flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900">Welcome to निvaran AI</h1>
            <p className="text-slate-400 text-sm mt-1">Verify your identity to get started</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'verification' ? (
              <motion.div
                key="step-verification" // ADD THIS UNIQUE KEY
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* ... Your OTP/Email inputs ... */}
              </motion.div>
            ) : (
              <motion.div
                key="step-details" // ADD THIS UNIQUE KEY
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* ... Your Password/Finalization inputs ... */}
              </motion.div>
            )}
          </AnimatePresence>

          {step === 'verification' ? (
            <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm" placeholder="Enter full name" disabled={otpSent} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm" placeholder="Enter your email" disabled={otpSent} required />
              </div>
              {otpSent && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Verification Code</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-emerald-50 focus:bg-white focus:border-emerald-500 outline-none transition-all text-center text-xl font-bold tracking-[0.5em]" placeholder="000000" required />
                  <div className="text-[10px] text-slate-400 text-center mt-2">
                    {otpTimer > 0 ? `Resend available in ${otpTimer}s` : <button type="button" onClick={handleRequestOtp} className="text-emerald-600 font-bold">Resend OTP</button>}
                  </div>
                </motion.div>
              )}
              <button type="submit" disabled={submitting} className="w-full py-4 bg-[#10B981] hover:bg-[#0da070] text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50">
                {submitting ? 'Processing...' : otpSent ? 'Verify Code' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">UID / Aadhaar Number</label>
                  <input
                    type="text"
                    name="uid_number"
                    value={form.uid_number}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm"
                    placeholder="12-digit UID"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm" placeholder="••••••••" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm</label>
                  <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none transition-all text-sm" placeholder="••••••••" required />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition-all active:scale-[0.98]">
                {submitting ? 'Finalizing...' : 'Complete Registration'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Don't have an account? <span onClick={() => navigate('/citizen-signup')} className="text-emerald-600 font-bold cursor-pointer hover:underline">Sign Up</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}