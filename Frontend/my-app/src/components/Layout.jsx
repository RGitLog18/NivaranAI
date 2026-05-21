import React, { useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext'; 
import { Toaster } from './ui2/sonner';
import { TutorialOverlay } from './TutorialOverlay.jsx';
import { User, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 

export function Layout() {
  const location = useLocation();
  const { showTutorial, setShowTutorial } = useApp();
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    if ((location.pathname === '/dashboard' || location.pathname === '/dashboard/') && user?.role !== 'Contractor') {
      const tutorialCompleted = localStorage.getItem('tutorialCompleted');
      if (!tutorialCompleted) {
        const timer = setTimeout(() => setShowTutorial(true), 800);
        return () => clearTimeout(timer);
      }
    } else {
      setShowTutorial(false);
    }
  }, [location.pathname, setShowTutorial, user?.role]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* --- DYNAMIC NAVBAR (Green + Off-white Theme) --- */}
      <nav className="h-16 bg-[#fcfcf9] border-b border-stone-200 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="font-bold text-xl text-emerald-700 tracking-tight flex items-center gap-2">
            <span className="bg-emerald-700 text-white px-1.5 py-0.5 rounded">नि</span>
            <span className="text-stone-800">varan</span>
          </Link>
          
          <div className="hidden md:flex gap-6 text-sm font-bold text-stone-600">
            <Link to="/dashboard/visualization" className="hover:text-emerald-700 transition-colors">Map View</Link>
            {user?.role === 'Contractor' ? (
              <Link to="/dashboard/agent-portal" className="hover:text-emerald-700 transition-colors">My Missions</Link>
            ) : (
              <Link to="/dashboard/agent-portal" className="hover:text-emerald-700 transition-colors">Agent Registry</Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-stone-400 hover:bg-emerald-50 hover:text-emerald-700 rounded-full transition-all">
            <Bell size={20} />
          </button>

          {/* USER PROFILE SECTION */}
          <div className="flex items-center gap-3 pl-4 border-l border-stone-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-extrabold text-stone-800 leading-none">
                {user?.name || "Official User"}
              </p>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1.5 bg-emerald-50 px-2 py-0.5 rounded">
                {user?.specific_role || user?.role || "Government"}
              </p>
            </div>
            
            {/* Avatar Circle (Emerald) */}
            <div className="h-10 w-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-100 border-2 border-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
            </div>

            <button 
              onClick={()=>navigate('/login')}
              className="ml-2 p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* --- PAGE CONTENT --- */}
      <main className="flex-1 relative">
        <Outlet /> 
      </main>
      
      {/* Tutorial Overlay */}
      {showTutorial && (
        <TutorialOverlay />
      )}
      
      <Toaster richColors position="top-right" />
    </div>
  );
}