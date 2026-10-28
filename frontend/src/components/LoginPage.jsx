import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Car,
  Shield,
  UserCheck,
  Loader2
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
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Top Nav */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between px-4 sm:px-6 pt-5 pb-3">
        <button
          onClick={onGoToLanding}
          className="flex items-center space-x-2 text-xs font-semibold text-neutral-400 hover:text-white transition py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GeoGuard</span>
        </button>
        <span className="text-xl font-black tracking-tighter text-white">GeoGuard</span>
      </div>

      {/* Main Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 pb-8">
        <div className="max-w-md w-full mx-auto space-y-6">

          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              What's your account?
            </h1>
            <p className="text-sm text-neutral-400 mt-2">
              Sign in to access your GeoGuard dashboard.
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
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-white transition placeholder:text-neutral-600"
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
                className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-white transition placeholder:text-neutral-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-neutral-200 disabled:opacity-60 text-black font-bold text-sm py-4 rounded-full transition shadow flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">or try a demo account</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          {/* Demo Profile Cards */}
          <div className="space-y-2">
            {/* Admin Demo */}
            <button
              type="button"
              onClick={() => handleQuickDemo('admin', 'admin123')}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between hover:bg-neutral-800 cursor-pointer transition text-left"
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
              <div className="text-right">
                <p className="text-[10px] text-neutral-500 font-mono">admin</p>
                <p className="text-xs font-bold text-neutral-300 font-mono">admin123</p>
              </div>
            </button>

            {/* Security Demo */}
            <button
              type="button"
              onClick={() => handleQuickDemo('security', 'security123')}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between hover:bg-neutral-800 cursor-pointer transition text-left"
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
              <div className="text-right">
                <p className="text-[10px] text-neutral-500 font-mono">security</p>
                <p className="text-xs font-bold text-emerald-400 font-mono">security123</p>
              </div>
            </button>

            {/* Driver Demo */}
            <button
              type="button"
              onClick={() => handleQuickDemo('driver', 'driver123')}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between hover:bg-neutral-800 cursor-pointer transition text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-neutral-800 rounded-xl text-amber-400">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Amogh S Patil (Driver KA-25-EA-1024)</p>
                  <p className="text-[10px] text-neutral-400">Vehicle KA-25-EA-1024 • Driver HUD</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-neutral-500 font-mono">driver</p>
                <p className="text-xs font-bold text-amber-400 font-mono">driver123</p>
              </div>
            </button>
          </div>

          {/* Switch to Signup */}
          <div className="pt-2 text-center">
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
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-neutral-600 py-3">
        SDMCET Dharwad • CSE Major Project
      </div>
    </div>
  );
}
