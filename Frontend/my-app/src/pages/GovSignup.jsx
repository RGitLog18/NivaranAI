import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

// --- KEYWORDS FOR THE BREATHING ANIMATION ---
const GOV_KEYWORDS = [
  "Administrative Control", "Protocol v2", "Secure Ledger",
  "Policy Triage", "Official Trust", "Sovereign Access"
];

export default function GovSignup() {
  const navigate = useNavigate();
  const { error, setError } = useAuth();

  // --- UI & LOGIC STATES ---
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [form, setForm] = useState({ name: '', email: '' });

  // OTP Resend Timer Logic
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const checkResumption = async () => {
    if (!form.email.includes('@')) return;
    try {
      const res = await axios.get(`http://${import.meta.env.VITE_API_URL}/api/onboarding/status?email=${form.email.trim()}`);

      // 1. If user is fully complete, go to login
      if (res.data.is_setup_complete) {
        toast.info("Account verified. Please log in.");
        navigate('/login');
        return;
      }

      // 2. ONLY resume if they are past Stage 1
      // If onboarding_step is 1, they should stay on this page to do OTP
      if (res.data.skip_otp && res.data.onboarding_step > 1) {
        toast.success(`Resuming your setup at Stage ${res.data.onboarding_step}`);
        localStorage.setItem('gov_signup_email', form.email.trim());
        navigate('/admin-onboarding');
      }
    } catch (err) {
      console.error("New Identity Detected");
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await axios.post(`http://${import.meta.env.VITE_API_URL}/api/gov/send-otp`, {
        email: form.email.trim(), name: form.name.trim(), role: 'government', is_signup: true
      });

      const fd = new FormData();
      fd.append('email', form.email.trim());
      fd.append('step', 1);
      fd.append('field', 'name');
      fd.append('value', form.name.trim());
      await axios.patch(`http://${import.meta.env.VITE_API_URL}/api/onboarding/update-step`, fd);

      setOtpSent(true);
      setOtpTimer(60);
      setSuccessMsg('Digital Handshake Dispatched.');
    } catch (err) {
      const detail = err.response?.data?.detail || "Handshake failed.";
      if (err.response?.status === 400 && detail.toLowerCase().includes('already registered')) {
        toast.success("Account found! Redirecting to Login...");
        setTimeout(() => navigate('/login'), 1500);
        return;
      }
      setError(detail);
    } finally { setSubmitting(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await axios.post(`http://${import.meta.env.VITE_API_URL}/api/gov/verify-otp`, {
        email: form.email.trim(), code: otp.trim()
      });

      if (response.data.token) localStorage.setItem('token', response.data.token);
      localStorage.setItem('gov_signup_email', form.email.trim());
      localStorage.setItem('gov_signup_name', form.name.trim());

      const fd = new FormData();
      fd.append('email', form.email.trim());
      fd.append('step', 1);
      fd.append('field', 'name');
      fd.append('value', form.name.trim());
      await axios.patch(`http://${import.meta.env.VITE_API_URL}/api/onboarding/update-step`, fd);

      toast.success("Identity Verified. Initiating administrative moulding...");
      setTimeout(() => navigate('/admin-onboarding'), 1000);
    } catch (err) { setError(err.response?.data?.detail || 'Invalid Handshake Code.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 1. BACKDROP BLUR */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
        onClick={() => navigate('/')}
      />

      {/* 2. THE CARD (Using Citizen's Design) */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-white rounded-[40px] overflow-hidden flex flex-col md:flex-row shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)]"
      >
        <button onClick={() => navigate('/')} className="absolute top-8 right-8 z-50 p-2 rounded-full hover:bg-slate-50 text-slate-300 hover:text-slate-500 transition-all">
          <X size={20} />
        </button>

        {/* LEFT PANEL: EMERALD IDENTITY */}
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
            <h2 className="text-3xl font-black mb-4 uppercase">निvaran</h2>
            <p className="text-emerald-50 text-xs opacity-80 max-w-[200px] leading-relaxed">
              Register your official identity to access the administrative terminal.
            </p>
            <div className="mt-16 flex flex-col items-center">
              <div className="w-12 h-1 bg-white/30 rounded-full mb-3" />
              <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-60">Sovereign Protocol</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: FORM HUB */}
        <div className="md:w-7/12 p-10 md:p-16 bg-white flex flex-col justify-center">
          <div className="mb-10">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Official Registration</h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Initialize administrative handshake</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl border border-rose-100 flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> {error}
              </motion.div>
            )}
            {successMsg && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl border border-emerald-100 flex items-center gap-3">
                <CheckCircle2 size={14} /> {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm font-medium" placeholder="Full Legal Name" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} onBlur={checkResumption} className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm font-medium" placeholder="gov-official@nic.in" required />
              </div>
              <button type="submit" disabled={submitting} className="w-full py-4 bg-[#10B981] hover:bg-[#0da070] text-white rounded-[20px] font-bold text-base shadow-xl shadow-emerald-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
                {submitting ? 'Dispatching...' : 'Request Handshake'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleVerifyOtp} className="space-y-8">
              <div className="text-center space-y-2">
                <p className="text-sm text-slate-500 font-medium">Enter 6-digit code for</p>
                <p className="text-sm font-bold text-slate-900 bg-slate-100 inline-block px-3 py-1 rounded-full">{form.email}</p>
              </div>
              <div className="flex justify-center">
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full max-w-[280px] py-5 rounded-2xl bg-emerald-50 border-2 border-emerald-100 text-center text-3xl font-black tracking-[0.5em] text-emerald-700 outline-none focus:border-emerald-500 transition-all" placeholder="000000" required />
              </div>
              <div className="space-y-4">
                <button type="submit" disabled={submitting} className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-[20px] font-bold text-base transition-all active:scale-[0.98]">
                  {submitting ? 'Authorizing...' : 'Authorize Now'}
                </button>
                <div className="text-center">
                  {otpTimer > 0 ? <span className="text-[11px] font-bold text-slate-400 uppercase">Available in {otpTimer}s</span> : <button type="button" onClick={handleRequestOtp} className="text-[11px] font-extrabold text-emerald-600 uppercase hover:underline">Resend Code</button>}
                </div>
              </div>
            </motion.form>
          )}

          <div className="mt-12 text-center pt-8 border-t border-slate-50">
            <Link to="/login" className="text-xs text-slate-400 font-semibold hover:text-emerald-600 transition-colors">Already registered? Log In</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}