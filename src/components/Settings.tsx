import React, { useState } from 'react';
import { 
  Shield, 
  Moon, 
  Sun, 
  Bell, 
  Globe, 
  Lock,
  Maximize,
  Type,
  Key
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../hooks/useTheme';

export default function Settings() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [scale, setScale] = useState(100);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-enter" style={{ zoom: `${scale}%` }}>
      <div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">System Settings</h1>
        <p className="text-sm font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-2">Manage application preferences and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Security */}
        <section className="glass-card rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-8">
          <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase flex items-center gap-3 mb-8">
            <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Security Settings
          </h2>
          <div className="space-y-6">
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Change Password</p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Update your login credentials.</p>
                </div>
              </div>
              <div className="space-y-4">
                <input type="password" placeholder="Current Password" className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-sm font-bold" />
                <input type="password" placeholder="New Password" className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-sm font-bold" />
                <button className="w-full btn-primary py-4 text-[10px]">Update Password</button>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-8">
          {/* Preferences */}
          <section className="glass-card rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-8">
            <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-8">Preferences</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Dark Mode</span>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    darkMode ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                    darkMode ? "right-1" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Notifications</span>
                </div>
                <button 
                  onClick={() => setNotifications(!notifications)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    notifications ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                    notifications ? "right-1" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Language</span>
                </div>
                <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest rounded-xl px-3 py-1.5 outline-none text-slate-900 dark:text-white">
                  <option>English</option>
                  <option>French</option>
                  <option>Spanish</option>
                </select>
              </div>
            </div>
          </section>

          {/* Scale Control */}
          <section className="glass-card rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-8">
            <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase mb-8 flex items-center gap-3">
              <Maximize className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Interface Scale
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Scale: {scale}%</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setScale(Math.max(80, scale - 10))}
                    className="p-2 glass-card rounded-xl hover:bg-blue-500/10 transition-all"
                  >
                    <Type className="w-4 h-4 scale-75" />
                  </button>
                  <button 
                    onClick={() => setScale(Math.min(120, scale + 10))}
                    className="p-2 glass-card rounded-xl hover:bg-blue-500/10 transition-all"
                  >
                    <Type className="w-4 h-4 scale-125" />
                  </button>
                </div>
              </div>
              <input 
                type="range" 
                min="80" 
                max="120" 
                step="5" 
                value={scale} 
                onChange={(e) => setScale(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
