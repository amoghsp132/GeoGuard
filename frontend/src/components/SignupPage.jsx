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
import { registerUser } from '../api';

const ROLES = [
  {
    id: 'SECURITY',
    label: 'Security Personnel',
    description: 'Monitor vehicles, manage incidents',
    icon: Shield,
  },
  {
    id: 'DRIVER',
    label: 'Driver',
    description: 'Navigate with real-time zone warnings',
    icon: Car,
  },
  {
    id: 'ADMIN',
    label: 'Admin',
    description: 'Full system management access',
    icon: UserCheck,
  },
];

const STEP_HEADINGS = {
  SECURITY: 'Create your Security account',
  DRIVER: 'Create your Driver account',
  ADMIN: 'Create Admin account',
};

export default function SignupPage({ onGoToLogin, onGoToLanding, onAuthSuccess }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (role) setStep(2);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setError('');
    } else {
      onGoToLanding();
    }
  };

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
        vehicle_number: role === 'DRIVER' ? vehicleNumber : '',
      });
      onAuthSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Header */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between px-4 sm:px-6 pt-5 pb-3">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-xs font-semibold text-neutral-400 hover:text-white transition py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-xl font-black tracking-tighter text-white">GeoGuard</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 pb-8">
        <div className="max-w-md w-full mx-auto space-y-6">

          {/* ── Step 1: Role Selection ── */}
          {step === 1 && (
            <>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Join as...
                </h1>
                <p className="text-sm text-neutral-400 mt-2">
                  Select your role to get started with GeoGuard.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {ROLES.map((r) => {
                  const isSelected = role === r.id;
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`bg-neutral-900 border rounded-2xl p-4 sm:p-5 flex items-center gap-4 cursor-pointer transition text-left ${
                        isSelected
                          ? 'border-white bg-neutral-800'
                          : 'border-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <div className={`p-3 rounded-xl shrink-0 transition ${
                        isSelected ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{r.label}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{r.description}</p>
                      </div>
                      {isSelected && (
                        <div className="ml-auto w-4 h-4 rounded-full bg-white shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!role}
                onClick={handleContinue}
                className="w-full bg-white hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm py-4 rounded-full transition shadow flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* ── Step 2: Details Form ── */}
          {step === 2 && (
            <>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  {STEP_HEADINGS[role]}
                </h1>
                <p className="text-sm text-neutral-400 mt-2">
                  Fill in your details below to create your account.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-neutral-900 border border-red-800 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Full Name */}
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

                {/* Username */}
                <div>
                  <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                    Username *
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

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white transition placeholder:text-neutral-600"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white transition placeholder:text-neutral-600"
                  />
                </div>

                {/* Password */}
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

                {/* Vehicle Number — only for DRIVER */}
                {role === 'DRIVER' && (
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">
                      Vehicle Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="KA-25-EA-XXXX"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 text-amber-300 font-mono rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-white transition placeholder:text-amber-900"
                    />
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-neutral-200 disabled:opacity-60 text-black font-bold text-sm py-4 rounded-full transition shadow flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
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
            </>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-neutral-600 py-3">
        SDMCET Dharwad • CSE Major Project
      </div>
    </div>
  );
}
