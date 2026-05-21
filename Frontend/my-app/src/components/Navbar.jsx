import { Moon, Sun, Settings, LogOut } from 'lucide-react';
import { Button } from './ui2/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui2/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Officer";

  return (
    /* Changed to bg-slate-50 (Off-white) and text-slate-800 */
    <nav className="bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-gray-100 border-b border-slate-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">

          {/* Left Section - Welcome & Username */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Welcome back,</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                {user?.name || "Officer"}
              </span>
              {/* Subtle light-green badge for the role */}
              <span className="text-[10px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                {displayRole}
              </span>
            </div>
          </div>

          {/* Center Section - App Name */}
          <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              Citizen Complaint <span className="text-emerald-600">Management</span> System
            </h1>
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-800"
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/settings')}
              className="text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-800"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hover:bg-slate-200 dark:hover:bg-gray-800 rounded-full p-1 transition-colors cursor-pointer outline-none ml-2">
                  <Avatar className="h-9 w-9 border border-slate-200 shadow-sm">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-emerald-600 text-white font-bold">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2 shadow-xl border-slate-200">
                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="cursor-pointer font-medium">
                  <Settings className="mr-2 h-4 w-4 text-slate-400" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer font-medium">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout Account</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}