import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Search, Languages, CheckCircle2, 
  MessageSquare, Cpu, UserCheck, ArrowRight, 
  Zap, Globe, BarChart3, Fingerprint, FileText, Lock
} from 'lucide-react';

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function ManualPage() {
  const navigate = useNavigate();
  const [morphText, setMorphText] = useState("खड्डा");

  // Logic for the Stage 3 Text Morph (Marathi -> English)
  useEffect(() => {
    const interval = setInterval(() => {
      setMorphText(prev => prev === "खड्डा" ? "Pothole" : "खड्डा");
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const enterAsGuest = () => {
    // Set a dummy ward so the dashboard knows what to show
      localStorage.setItem('guest_ward', 'Dombivli East');
      // Clear any old tokens to ensure we are in guest mode
      localStorage.removeItem('token'); 
      navigate('/dashboard');
   };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-emerald-100 overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img 
        src="/Nivaran%20logo.jpeg" 
        alt="Nivaran Logo" 
        className="h-10 w-10 rounded-lg object-cover border border-slate-100 shadow-sm" 
    />
            <span className="text-xl font-black tracking-tighter">निvaran </span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-slate-600">
            <a href="#flow" className="hover:text-emerald-500 transition-colors">The Flow</a>
            <a href="#security" className="hover:text-emerald-500 transition-colors">Security</a>
            <a href="#get-started" className="hover:text-emerald-500 transition-colors">Get Started</a>
          </div>
          {/* <button onClick={() => navigate('/login')} className="rounded-full bg-emerald-500 px-8 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-200 hover:bg-emerald-600 hover:-translate-y-1 transition-all">
            Launch Platform
          </button> */}
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-20 lg:pt-56">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                निvaran 
              </motion.div>
              <motion.h1 variants={itemVariants} className="mt-8 text-6xl font-black tracking-tight leading-[1.1] md:text-8xl text-slate-900">
                The Future of <br />
                <span className="text-emerald-500 underline decoration-emerald-100 underline-offset-8">Governance</span> <br />
                is Here
              </motion.h1>
              <motion.p variants={itemVariants} className="mt-8 text-xl text-slate-500 max-w-lg leading-relaxed">
                Empowering citizens and officials with AI-driven tools for transparent, efficient, and accessible governance services.
              </motion.p>
              <motion.div variants={itemVariants} className="mt-12 flex flex-wrap gap-5">
                <button onClick={() => navigate('/citizen-login')} className="flex items-center gap-3 rounded-2xl bg-emerald-500 px-8 py-5 text-lg font-bold text-white shadow-2xl shadow-emerald-200 hover:bg-emerald-600">
                  Citizen Portal <ArrowRight size={20} />
                </button>
                <button onClick={() => navigate('/login')} className="rounded-2xl border-2 border-slate-200 px-8 py-5 text-lg font-bold text-slate-700 hover:bg-slate-50">
                  Government Portal
                </button>
              </motion.div>
              <motion.div variants={itemVariants} className="mt-10 flex gap-8">
                <div className="flex items-center gap-2 text-slate-400 font-medium"><Lock size={18} /> Bank-grade Security</div>
                <div className="flex items-center gap-2 text-slate-400 font-medium"><UserCheck size={18} /> 1M+ Users</div>
              </motion.div>
            </motion.div>

            {/* AI SCANNER CORE VISUAL */}
            <div className="relative">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-emerald-100 rounded-full scale-125" />
              <div className="relative z-10 mx-auto h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-emerald-50 to-blue-50 flex items-center justify-center border border-white shadow-inner">
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }} className="h-64 w-64 bg-white rounded-full shadow-2xl flex items-center justify-center border border-emerald-50">
                   <div className="relative">
                      <Cpu size={120} className="text-emerald-500 opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      <div className="text-center font-black text-emerald-600">
                         <div className="text-4xl">निvaran</div>
                         <div className="text-xs tracking-[0.5em] mt-1"></div>
                      </div>
                   </div>
                </motion.div>
                {/* FLOATING SCANNER LINE */}
                <motion.div animate={{ top: ["20%", "80%", "20%"] }} transition={{ duration: 3, repeat: Infinity }} className="absolute left-10 right-10 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent blur-sm z-20" />
              </div>
            </div>
          </div>
          <div className="mt-20 text-center text-slate-400 animate-bounce">Scroll to explore <br /> ↓</div>
        </div>
      </section>

      {/* --- THE निvaran FLOW (KINETIC PIPELINE) --- */}
      <section id="flow" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="inline-block rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-bold text-emerald-600 mb-8">The निvaran Flow</div>
          <h2 className="text-5xl font-black tracking-tight text-slate-900">From Complaint to <span className="text-emerald-500">Resolution</span></h2>
          <p className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Watch how निvaran AI transforms citizen grievances into actionable intelligence, seamlessly routing through our AI-powered pipeline.
          </p>

          <div className="mt-32 relative">
             {/* THE PIPELINE TRACK */}
             <div className="absolute top-12 left-0 w-full h-[6px] bg-slate-200 rounded-full" />
             <motion.div 
               initial={{ width: 0 }} 
               whileInView={{ width: "100%" }} 
               viewport={{ once: true }}
               transition={{ duration: 3 }}
               className="absolute top-12 left-0 h-[6px] bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full z-10" 
             />
             
             {/* THE GLOWING DATA PACKET */}
             <motion.div 
                animate={{ x: ["0%", "100%"] }} 
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-[38px] w-8 h-8 bg-emerald-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(16,185,129,0.8)] z-20" 
             />

             <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pt-24 relative z-30">
                {/* NODE 1 */}
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center mb-6 hover:scale-110 transition-transform">
                      <MessageSquare className="text-emerald-500" size={40} />
                   </div>
                   <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">Verified Handshake (OTP)</h3>
                   <p className="text-sm text-slate-500 leading-relaxed px-4">Secure citizen authentication with one-time password verification.</p>
                   <div className="mt-4 text-emerald-500 font-bold flex items-center gap-1 text-xs">
                      <CheckCircle2 size={14} /> Identity Verified
                   </div>
                </div>

                {/* NODE 2 */}
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center mb-6 relative">
                      <Search className="text-emerald-500" size={40} />
                      <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 border-4 border-emerald-500 rounded-full" />
                   </div>
                   <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">YOLOv11 Visual Authentication</h3>
                   <p className="text-sm text-slate-500 leading-relaxed px-4">AI-powered image analysis detects and classifies infrastructure issues.</p>
                   <div className="mt-4 bg-slate-100 rounded px-2 py-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">pothole</span>
                      <div className="w-10 h-10 border-2 border-emerald-400 rounded-sm flex items-center justify-center">
                         <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                      </div>
                   </div>
                </div>

                {/* NODE 3 */}
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center mb-6">
                      <Languages className="text-emerald-500" size={40} />
                   </div>
                   <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">Multilingual Sorting</h3>
                   <p className="text-sm text-slate-500 leading-relaxed px-4">Seamless translation between regional languages and administrative terminology.</p>
                   <div className="mt-6 flex flex-col items-center min-h-[50px] justify-center">
                      <AnimatePresence mode="wait">
                        <motion.span 
                          key={morphText}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-2xl font-black text-slate-400 tracking-tighter"
                        >
                          {morphText}
                        </motion.span>
                      </AnimatePresence>
                   </div>
                </div>

                {/* NODE 4 */}
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center mb-6">
                      <UserCheck className="text-emerald-500" size={40} />
                   </div>
                   <h3 className="font-bold text-lg mb-2 uppercase tracking-tight">Automated Resolution Audit</h3>
                   <p className="text-sm text-slate-500 leading-relaxed px-4">Smart routing to the right department with automatic status updates.</p>
                   <div className="mt-4 flex flex-col gap-2 w-full max-w-[120px]">
                      <div className="flex items-center justify-between text-[10px] border border-slate-200 p-1 rounded bg-white">
                         <span className="flex items-center gap-1 font-bold text-slate-400 truncate"><FileText size={10} /> Desk 1</span>
                         <CheckCircle2 size={10} className="text-emerald-500" />
                      </div>
                      <div className="flex items-center justify-center gap-3">
                         <button className="p-1 rounded bg-slate-50 border border-slate-100"><Zap size={14} className="text-amber-500" /></button>
                         <button className="p-1 rounded bg-slate-50 border border-slate-100"><ShieldCheck size={14} className="text-emerald-500" /></button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- BENTO GRID SECTION --- */}
      <section id="security" className="py-32 px-6">
         <div className="mx-auto max-w-7xl">
            <div className="text-center mb-20">
               <span className="text-emerald-500 font-bold uppercase tracking-widest text-xs">Platform Features</span>
               <h2 className="text-6xl font-black mt-4 tracking-tighter">Everything You Need, <br /><span className="text-slate-300">Nothing You Don't</span></h2>
               <p className="mt-6 text-slate-500 font-medium">Built with cutting-edge technology to deliver a seamless experience for both citizens and government officials.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-100 hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-sm text-emerald-500"><Zap /></div>
                  <h3 className="text-2xl font-bold mb-4">Lightning Fast</h3>
                  <p className="text-slate-500 leading-relaxed">Process requests in milliseconds with our AI-powered backend infrastructure.</p>
               </div>
               <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-100 hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-sm text-emerald-500"><Lock /></div>
                  <h3 className="text-2xl font-bold mb-4">End-to-End Encryption</h3>
                  <p className="text-slate-500 leading-relaxed">Your data is protected with military-grade encryption at every step.</p>
               </div>
               <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-100 hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-sm text-emerald-500"><Globe /></div>
                  <h3 className="text-2xl font-bold mb-4">Multi-language Support</h3>
                  <p className="text-slate-500 leading-relaxed">Access services in your preferred language with real-time translation.</p>
               </div>
               <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-100 hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-sm text-emerald-500"><BarChart3 /></div>
                  <h3 className="text-2xl font-bold mb-4">Real-time Analytics</h3>
                  <p className="text-slate-500 leading-relaxed">Track and monitor all activities with comprehensive dashboards.</p>
               </div>
               <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-100 hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-sm text-emerald-500"><FileText /></div>
                  <h3 className="text-2xl font-bold mb-4">Smart Documents</h3>
                  <p className="text-slate-500 leading-relaxed">AI-assisted document processing and verification in seconds.</p>
               </div>
               <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-100 hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-sm text-emerald-500"><Fingerprint /></div>
                  <h3 className="text-2xl font-bold mb-4">Biometric Auth</h3>
                  <p className="text-slate-500 leading-relaxed">Secure authentication with fingerprint and face recognition.</p>
               </div>
            </div>
         </div>
      </section>

      {/* --- ROLE SELECTION (GET STARTED) --- */}
      <section id="get-started" className="py-32 px-6 bg-slate-900 text-white">
         <div className="mx-auto max-w-7xl text-center">
            <button className="bg-white/10 text-emerald-400 px-6 py-2 rounded-full text-xs font-bold mb-8 backdrop-blur">Choose Your Path</button>
            <h2 className="text-6xl font-black mb-6">How Will You <span className="text-emerald-500 italic underline decoration-white underline-offset-[10px]">Get Started?</span></h2>
            <p className="text-slate-400 text-xl max-w-xl mx-auto">Select your role to access personalized features and services designed specifically for you.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-24">
               <div className="bg-white/5 border border-white/10 p-12 rounded-[40px] text-left hover:bg-white/10 transition-all group">
                  <div className="flex items-center justify-between mb-10">
                     <div className="p-5 rounded-[20px] bg-emerald-500 text-slate-900"><UserCheck size={32} /></div>
                     <span className="text-[10px] font-bold tracking-[0.3em] text-emerald-500 uppercase">Popular</span>
                  </div>
                  <h3 className="text-3xl font-black mb-6">Citizen</h3>
                  <p className="text-slate-400 mb-10 leading-relaxed">Access government services, track applications, and engage with your community.</p>
                  <ul className="space-y-4 mb-12 text-sm font-medium text-slate-300">
                     <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500" /> Apply for documents online</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500" /> Track application status</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500" /> Access public records</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500" /> Community engagement tools</li>
                  </ul>
                  <button onClick={() => navigate('/citizen')} className="w-full bg-emerald-500 text-slate-900 py-5 rounded-2xl font-bold text-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-3">
                     Citizen Portal <ArrowRight />
                  </button>
               </div>

               <div className="bg-white/5 border border-white/10 p-12 rounded-[40px] text-left hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-between mb-10">
                     <div className="p-5 rounded-[20px] bg-slate-800 text-emerald-500 border border-emerald-500/20"><FileText size={32} /></div>
                  </div>
                  <h3 className="text-3xl font-black mb-6">Official</h3>
                  <p className="text-slate-400 mb-10 leading-relaxed">Manage services, process requests, and streamline administrative workflows.</p>
                  <ul className="space-y-4 mb-12 text-sm font-medium text-slate-300">
                     <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500" /> Process citizen requests</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500" /> Analytics dashboard</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500" /> Document verification</li>
                     <li className="flex items-center gap-3"><CheckCircle2 size={16} className="text-emerald-500" /> Inter-department coordination</li>
                  </ul>
                  <button onClick={() => navigate('/dashboard')} className="w-full bg-white text-slate-900 py-5 rounded-2xl font-bold text-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-3">
                     Access Command Center <ArrowRight />
                  </button>
               </div>
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-slate-100 flex flex-col items-center gap-10">
         <div className="flex gap-10 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-emerald-500 transition-all">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-500 transition-all">Terms of Service</a>
            <a href="#" className="hover:text-emerald-500 transition-all">Contact</a>
         </div>
         <p className="text-xs font-bold text-slate-300">© 2026 Public Grievance Management System — Government of India</p>
      </footer>

    </div>
  );
}