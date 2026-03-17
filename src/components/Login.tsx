import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Hotel, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/auth/login', { username, password });
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 dark:bg-blue-600/20 blur-[120px] animate-float" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/20 dark:bg-purple-600/20 blur-[120px] animate-float" style={{ animationDuration: '15s', animationDelay: '2s' }} />
      </div>

      <div className="max-w-md w-full glass-card rounded-[2rem] p-10 relative z-10 animate-enter">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20 hover:rotate-12 transition-transform duration-300">
            <Hotel className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">SuiteControl</h1>
          <p className="text-blue-600 dark:text-blue-400 text-xs tracking-widest mt-3 uppercase font-bold">Hotel Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-2xl text-center font-medium">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-medium"
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-medium"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 mt-8 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 text-center">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-widest uppercase font-bold">
            SuiteControl Hotel System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
