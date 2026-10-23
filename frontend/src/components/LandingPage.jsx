import React, { useState } from 'react';
import { 
  Shield, 
  Navigation, 
  MapPin, 
  ArrowRight, 
  Clock, 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ShieldAlert,
  Zap,
  UserCheck
} from 'lucide-react';

export default function LandingPage({ onGoToSignup, onGoToLogin, onQuickDemo }) {
  const [selectedRide, setSelectedRide] = useState('uber_go');

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black flex flex-col">
      
      {/* Uber Minimal Navigation Bar */}
      <header className="border-b border-neutral-800 bg-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          
          {/* Uber Wordmark Brand */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-tighter text-white">Uber</span>
              <span className="text-xl font-bold tracking-tight text-neutral-300">GeoGuard</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-1">
              <span className="text-[11px] font-semibold bg-neutral-900 border border-neutral-700/80 text-neutral-300 px-2.5 py-1 rounded-full">
                SDMCET Dharwad • CSE Major Project
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onGoToLogin}
              className="text-xs font-semibold text-neutral-300 hover:text-white px-3 py-2 rounded-full hover:bg-neutral-900 transition"
            >
              Log in
            </button>
            <button
              onClick={onGoToSignup}
              className="bg-white hover:bg-neutral-200 text-black text-xs font-bold px-4 py-2 rounded-full transition shadow-sm"
            >
              Sign up
            </button>
          </div>

        </div>
      </header>

      {/* Main Hero Split View (Uber.com Layout) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full flex-1 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Left Column: Uber Booking Card & Headlines */}
        <div className="w-full lg:w-1/2 space-y-6">
          
          <div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-white">
              Go anywhere.<br />
              <span className="text-neutral-400">Stay out of restricted zones.</span>
            </h1>
            <p className="mt-4 text-base text-neutral-400 max-w-lg leading-relaxed">
              A pure-software, GPS & OSRM road-aware warning system. Prevents unauthorized vehicle incursions into sensitive zones without physical barriers.
            </p>
          </div>

          {/* Uber Style Booking / Dispatch Container */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
            
            {/* Mode Selector Tabs */}
            <div className="flex space-x-4 border-b border-neutral-800 pb-3 text-xs font-bold">
              <button className="flex items-center space-x-2 text-white border-b-2 border-white pb-1">
                <Car className="w-4 h-4" />
                <span>Ride Safe</span>
              </button>
              <button onClick={onQuickDemo} className="flex items-center space-x-2 text-neutral-400 hover:text-white pb-1 transition">
                <Shield className="w-4 h-4" />
                <span>Security Dispatch</span>
              </button>
              <button onClick={onQuickDemo} className="flex items-center space-x-2 text-neutral-400 hover:text-white pb-1 transition">
                <Navigation className="w-4 h-4" />
                <span>Driver Cockpit</span>
              </button>
            </div>

            {/* Uber Origin & Destination Visual Inputs */}
            <div className="space-y-2 relative">
              
              {/* Pickup */}
              <div className="flex items-center space-x-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-3">
                <div className="w-2.5 h-2.5 rounded-full bg-white shrink-0 ml-1"></div>
                <div className="flex-1">
                  <p className="text-[10px] text-neutral-400 font-medium">Pickup location</p>
                  <p className="text-xs font-semibold text-white">Dhavalagiri Main Gate, SDMCET</p>
                </div>
              </div>

              {/* Destination */}
              <div className="flex items-center space-x-3 bg-neutral-900 border border-neutral-800 rounded-2xl p-3">
                <div className="w-2.5 h-2.5 bg-black border-2 border-white shrink-0 ml-1"></div>
                <div className="flex-1">
                  <p className="text-[10px] text-neutral-400 font-medium">Restricted Geofence Monitored</p>
                  <p className="text-xs font-semibold text-amber-400">Dharwad Cantonment & Campus Cordon</p>
                </div>
              </div>
            </div>

            {/* Ride Categories */}
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Choose Patrol or Transit Tier</p>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRide('uber_go')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    selectedRide === 'uber_go' 
                      ? 'bg-neutral-800 border-white text-white' 
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Car className="w-5 h-5 mb-1.5 text-white" />
                  <p className="text-xs font-bold text-white">UberGo</p>
                  <p className="text-[10px] text-neutral-400">Road Snapped</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRide('security_patrol')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    selectedRide === 'security_patrol' 
                      ? 'bg-neutral-800 border-white text-white' 
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Shield className="w-5 h-5 mb-1.5 text-emerald-400" />
                  <p className="text-xs font-bold text-white">Security</p>
                  <p className="text-[10px] text-neutral-400">Patrol Unit</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRide('vip_escort')}
                  className={`p-3 rounded-2xl border text-left transition ${
                    selectedRide === 'vip_escort' 
                      ? 'bg-neutral-800 border-white text-white' 
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Zap className="w-5 h-5 mb-1.5 text-amber-400" />
                  <p className="text-xs font-bold text-white">VIP Corridor</p>
                  <p className="text-[10px] text-neutral-400">Convoy Clear</p>
                </button>
              </div>
            </div>

            {/* CTAs in Uber Black/White Theme */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={onQuickDemo}
                className="flex-1 bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm py-3.5 rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
              >
                <span>Launch Live System Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onGoToSignup}
                className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-semibold text-xs sm:text-sm px-5 py-3.5 rounded-2xl transition text-center"
              >
                Register Vehicle
              </button>
            </div>

          </div>

        </div>

        {/* Right Column: Sleek Uber-style Live Map & Incident HUD Mockup */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">OSRM Road Router Active</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">500m Geofence Buffer</span>
            </div>

            {/* Live Driver Heads-up Simulation Banner (Uber Driver style) */}
            <div className="my-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-black border border-neutral-700 flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">In 440 meters</p>
                    <p className="text-[11px] text-amber-400 font-semibold">Approaching Dharwad Cantonment</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-amber-400 text-black px-2 py-0.5 rounded-full">
                  69s ETA
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-400 h-full w-2/3"></div>
              </div>
            </div>

            {/* Live Trip Cards */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-neutral-900/80 rounded-2xl border border-neutral-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-neutral-800 rounded-xl text-white">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">KA-25-EA-1024</p>
                    <p className="text-[10px] text-neutral-400">Driver: Amogh S Patil • 42 km/h</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-neutral-800 text-neutral-300 px-2 py-1 rounded-full border border-neutral-700">
                  Tracking
                </span>
              </div>

              <div className="p-3 bg-neutral-900/80 rounded-2xl border border-neutral-800/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-950/80 border border-red-800/80 rounded-xl text-red-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Breach Detection</p>
                    <p className="text-[10px] text-neutral-400">Point-in-polygon ray casting active</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-red-400">Instant Alert</span>
              </div>
            </div>

            {/* Quick Demo Access Trigger */}
            <button
              onClick={onQuickDemo}
              className="mt-6 w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold text-xs py-3 rounded-2xl transition flex items-center justify-center gap-2"
            >
              <span>Explore Interactive Tactical Console</span>
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>
        </div>

      </section>

      {/* Academic Details & Supervisor Bar */}
      <section className="border-t border-neutral-900 bg-neutral-950 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="p-5 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl flex items-center space-x-4">
            <div className="p-3 bg-neutral-800 rounded-2xl text-white">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Project Guide</p>
              <h4 className="text-base font-bold text-white mt-0.5">Dr. S. B. Kulkarni</h4>
              <p className="text-xs text-neutral-400">Associate Professor, Dept. of CSE & Dean IPD, SDMCET</p>
            </div>
          </div>

          <div className="p-5 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl">
            <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-2">Student Engineers</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-neutral-300">
              <div>• Amogh S Patil <span className="text-neutral-500 font-mono">(2SD23CS011)</span></div>
              <div>• Aryan Shetty <span className="text-neutral-500 font-mono">(2SD23CS019)</span></div>
              <div>• Dharesh Dodmani <span className="text-neutral-500 font-mono">(2SD23CS030)</span></div>
              <div>• Neha B Hunshikatti <span className="text-neutral-500 font-mono">(2SD23CS062)</span></div>
            </div>
          </div>

        </div>
      </section>

      {/* Uber Minimal Footer */}
      <footer className="border-t border-neutral-900 py-6 px-4 text-center text-xs text-neutral-600">
        SDM College of Engineering & Technology, Dhavalagiri, Dharwad – 580002 • Department of Computer Science & Engineering
      </footer>

    </div>
  );
}
