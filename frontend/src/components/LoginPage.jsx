import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle,
  Zap,
  Car,
  Shield,
  UserCheck
} from 'lucide-react';
import { loginUser } from '../api';

export default function LoginPage({ onGoToSignup, onGoToLanding, onAuthSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser(username, password);
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify username and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoUser, demoPass) => {
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(demoUser, demoPass);
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 sm:p-6 font-sans">
      
      {/* Top Uber Nav Bar */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={onGoToLanding}
          className="flex items-center space-x-2 text-xs font-semibold text-neutral-400 hover:text-white transition py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Uber GeoGuard</span>
        </button>

        <span className="text-xl font-black tracking-tighter text-white">Uber</span>
      </div>

      {/* Main Form Center Box */}
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            What's your account?
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            Sign in to access your dispatch dashboard or driver HUD.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-red-800 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Uber-style Input Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-neutral-400 block mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="e.g. admin or driver"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-white transition placeholder:text-neutral-600"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-400 block mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-white transition placeholder:text-neutral-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-neutral-200 text-black font-bold text-sm py-4 rounded-2xl transition shadow flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Signing In...' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Uber 1-Click Fast Roles (For Viva & Presentation) */}
        <div className="pt-6 border-t border-neutral-800/80 space-y-3">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider text-center">
            Instant Demo Profiles:
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('admin', 'admin123')}
              className="w-full p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between transition text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-neutral-800 rounded-xl text-white">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Dr. S. B. Kulkarni (Admin)</p>
                  <p className="text-[10px] text-neutral-400">Full Geofence & Zone Studio Privileges</p>
                </div>
              </div>
              <span className="text-xs font-bold text-neutral-400 font-mono">admin123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('security', 'security123')}
              className="w-full p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between transition text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-neutral-800 rounded-xl text-emerald-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Campus Security Officer</p>
                  <p className="text-[10px] text-neutral-400">Tactical Map & Incident Escalation</p>
                </div>
              </div>
              <span className="text-xs font-bold text-neutral-400 font-mono">security123</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('driver', 'driver123')}
              className="w-full p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between transition text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-neutral-800 rounded-xl text-amber-400">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Amogh S Patil (Driver)</p>
                  <p className="text-[10px] text-neutral-400">Vehicle KA-25-EA-1024 • Driver HUD</p>
                </div>
              </div>
              <span className="text-xs font-bold text-neutral-400 font-mono">driver123</span>
            </button>
          </div>
        </div>

        {/* Switch to Signup */}
        <div className="pt-4 text-center">
          <p className="text-xs text-neutral-400">
            Don't have an account?{' '}
            <button
              onClick={onGoToSignup}
              className="text-white font-bold underline underline-offset-4 ml-1"
            >
              Sign up
            </button>
          </p>
        </div>

      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-neutral-600 max-w-xl mx-auto py-2">
        SDMCET Dharwad • CSE Major Project
      </div>

    </div>
  );
}
