import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle,
  Car,
  Shield,
  UserCheck
} from 'lucide-react';
import { registerUser } from '../api';

export default function SignupPage({ onGoToLogin, onGoToLanding, onAuthSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('SECURITY');
  const [vehicleNumber, setVehicleNumber] = useState('KA-25-EA-1024');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
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
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 sm:p-6 font-sans">
      
      {/* Top Nav */}
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

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Create your account
          </h1>
          <p className="text-sm text-neutral-400 mt-2">
            Get started with restricted-area tracking and navigation.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-red-800 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
              Choose Username *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. driver_amogh"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white transition placeholder:text-neutral-600"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white transition placeholder:text-neutral-600"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Amogh S Patil"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white transition placeholder:text-neutral-600"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="text-xs font-bold text-neutral-400 block mb-1.5 uppercase tracking-wider">
              Select Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'SECURITY', label: 'Security', icon: Shield },
                { id: 'ADMIN', label: 'Admin', icon: UserCheck },
                { id: 'DRIVER', label: 'Driver', icon: Car },
              ].map(item => {
                const Icon = item.icon;
                const isSelected = role === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    className={`p-3 rounded-2xl border text-center transition ${
                      isSelected 
                        ? 'bg-neutral-800 border-white text-white' 
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs font-bold block">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {role === 'DRIVER' && (
            <div>
              <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                Vehicle Registration Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. KA-25-EA-1024"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 text-amber-300 font-mono rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white transition"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-neutral-200 text-black font-bold text-sm py-4 rounded-2xl transition shadow flex items-center justify-center gap-2 mt-4"
          >
            <span>{loading ? 'Creating...' : 'Sign Up'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 text-center">
          <p className="text-xs text-neutral-400">
            Already have an account?{' '}
            <button
              onClick={onGoToLogin}
              className="text-white font-bold underline underline-offset-4 ml-1"
            >
              Log in
            </button>
          </p>
        </div>

      </div>

      <div className="text-center text-[11px] text-neutral-600 max-w-xl mx-auto py-2">
        SDMCET Dharwad • CSE Major Project
      </div>

    </div>
  );
}
