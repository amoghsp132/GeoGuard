import React, { useState } from 'react';
import { 
  Shield, 
  Car, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  X, 
  CheckCircle, 
  AlertCircle,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { loginUser, registerUser } from '../api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('SECURITY');
  const [vehicleNumber, setVehicleNumber] = useState('KA-25-EA-1024');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await loginUser(username, password);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await registerUser({
          username,
          password,
          full_name: fullName,
          email,
          phone,
          role,
          vehicle_number: role === 'DRIVER' ? vehicleNumber : ''
        });
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoUsername, demoPassword) => {
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(demoUsername, demoPassword);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isLogin ? 'Sign In to Restricted Area System' : 'Create New System Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Role-Based Access Control • SDMCET Security Grid
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs: Sign In / Sign Up */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition ${
              isLogin ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition ${
              !isLogin ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Username *</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                required
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Password *</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amogh S Patil"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="SECURITY">Security Officer</option>
                    <option value="ADMIN">System Admin</option>
                    <option value="DRIVER">Vehicle Driver</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {role === 'DRIVER' && (
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Assigned Vehicle Reg. No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA-25-EA-1024"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-4"
          >
            <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In to Portal' : 'Register Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Logins for Presentations */}
        {isLogin && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-[11px] text-slate-400 font-medium mb-2 text-center">
              Instant 1-Click Role Logins (Demo & Evaluation):
            </p>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin', 'admin123')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold border border-slate-700/80 transition"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('security', 'security123')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold border border-slate-700/80 transition"
              >
                🛡️ Security
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('driver', 'driver123')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold border border-slate-700/80 transition"
              >
                🚗 Driver
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
