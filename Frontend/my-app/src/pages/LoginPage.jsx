import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { toast } from 'sonner';
import { X, User, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import './AuthPage.css';

// --- KEYWORDS FOR THE BREATHING ANIMATION (Matching GovSignUp UI) ---
const GOV_KEYWORDS = [
  "Administrative Control", "Protocol v2", "Secure Ledger",
  "Policy Triage", "Official Trust", "Sovereign Access"
];

export default function LoginPage({ defaultRole }) {
  const navigate = useNavigate();
  const { login, error, setError } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const signupPath = defaultRole === 'government' ? '/gov-signup' : '/citizen-signup';

  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await axios.post(`http://${import.meta.env.VITE_API_URL}/api/gov/send-otp`, {
        email: email.trim(),
        name: name.trim(),
        role: defaultRole,
        is_signup: false
      });
      setStep('otp');
      setOtpTimer(60);
      toast.success("Handshake Initialized: Check your email");
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication sequence failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAndLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`http://${import.meta.env.VITE_API_URL}/api/gov/verify-otp`, { email, code: otp });
      if (res.data.status === 'success') {
       
        const userData = res.data.user; 
      
      login({
        email: userData.email,
        name: userData.name,
        // Ensure we pass 'government' as the role so ProtectedRoutes work
        role: 'government', 
        admin_role: userData.admin_role,
        location: userData.location, // <--- ADD THIS LINE
        ward: userData.ward,         // <--- ADD THIS LINE
        is_onboarded: userData.is_setup_complete === 1,
      }, res.data.token);

        toast.success("Identity Secured");
        navigate(res.data.role === 'government' ? (userData.is_setup_complete === 1 ? '/gov-landing' : '/admin-onboarding') : '/citizen');
      }
    } catch (err) {
      setError("Invalid Authorization Code");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 1. BACKDROP BLUR */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
        onClick={() => navigate('/')}
      />

      {/* 2. THE CARD (Matching GovSignUp UI) */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-white rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)]"
      >
        {/* Close Button */}
        <button onClick={() => navigate('/')} className="absolute top-8 right-8 z-50 p-2 rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-500 transition-all">
          <X size={20} />
        </button>

        {/* Theme Toggle inside card for UI consistency */}
        <button className="absolute top-8 right-20 z-50 p-2 text-slate-300 hover:text-emerald-500 transition-all" onClick={toggleTheme}>
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* LEFT PANEL: EMERALD IDENTITY (Matching GovSignUp) */}
        <div className="md:w-5/12 bg-[#10B981] p-12 flex flex-col justify-center items-center text-center text-white relative">
          <div className="absolute inset-0 overflow-hidden">
            {GOV_KEYWORDS.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                animate={{ opacity: [0.05, 0.3, 0.05], y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: i * 1.2 }}
                className="absolute text-emerald-100 font-bold whitespace-nowrap pointer-events-none text-lg"
                style={{ top: `${20 + (i * 12)}%`, left: i % 2 === 0 ? '5%' : '40%' }}
              >
                {word}
              </motion.span>
            ))}
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-4 uppercase">{defaultRole === 'government' ? 'निvaran' : 'Citizen Login'}</h2>
            <p className="text-emerald-50 text-xs opacity-80 max-w-[200px] leading-relaxed">
              Authenticate your sovereign identity to access the unified terminal.
            </p>
            <div className="mt-16 flex flex-col items-center">
              <div className="w-12 h-1 bg-white/30 rounded-full mb-3" />
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-60">Handshake Protocol</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: FORM HUB */}
        <div className="md:w-7/12 p-10 md:p-16 bg-white flex flex-col justify-center">
          <div className="mb-10">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Access Authentication</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Identity verification required</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl border border-rose-100 flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 'credentials' ? (
              <motion.form
                key="creds"
                onSubmit={handleRequestOtp}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Registered Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm font-medium" placeholder="Full Legal Name" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm font-medium" placeholder="name@gov.in" required />
                </div>
                <button type="submit" disabled={submitting || otpTimer > 0} className="w-full py-4 bg-[#10B981] hover:bg-[#0da070] text-white rounded-[20px] font-bold text-base shadow-xl shadow-emerald-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
                  {submitting ? 'Initializing...' : 'Request OTP'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="otp"
                onSubmit={handleVerifyAndLogin}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <p className="text-sm text-slate-500 font-medium">Code dispatched to</p>
                  <p className="text-sm font-bold text-slate-900 bg-slate-100 inline-block px-3 py-1 rounded-full">{email}</p>
                </div>
                <div className="flex justify-center">
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full max-w-[280px] py-5 rounded-2xl bg-emerald-50 border-2 border-emerald-100 text-center text-3xl font-black tracking-[0.5em] text-emerald-700 outline-none focus:border-emerald-500 transition-all"
                    placeholder="000000"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <button type="submit" disabled={submitting} className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-[20px] font-bold text-base transition-all active:scale-[0.98]">
                    {submitting ? 'Authorizing...' : 'Authorize Now'}
                  </button>
                  <div className="text-center">
                    {otpTimer > 0 ? (
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Wait {otpTimer}s for new code</span>
                    ) : (
                      <button type="button" className="text-[11px] font-extrabold text-emerald-600 uppercase hover:underline" onClick={handleRequestOtp}>Resend Handshake</button>
                    )}
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-12 text-center pt-8 border-t border-slate-50">
            <span className="text-xs text-slate-400 font-semibold">New to the terminal? </span>
            <button onClick={() => navigate(signupPath)} className="text-xs text-emerald-600 font-bold hover:underline">Create Account</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}