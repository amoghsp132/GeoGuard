import React from 'react';
import { 
  Shield, 
  Navigation, 
  MapPin, 
  FileText, 
  Wifi, 
  LogOut, 
  LogIn,
  Car,
  Settings
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  wsConnected, 
  currentUser, 
  onOpenAuth, 
  onLogout 
}) {
  return (
    <header className="bg-black border-b border-neutral-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        
        {/* Top Branding & Account Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Uber Wordmark Brand + College Tag */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-white">GeoGuard</span>
            </div>

            <div className="hidden sm:flex items-center space-x-1 pl-3 border-l border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-400">
                SDMCET Dharwad • CSE Major Project
              </span>
            </div>
          </div>

          {/* Right Status & Profile Pill */}
          <div className="flex items-center space-x-3 justify-between md:justify-end">
            
            {/* Live Feed Status */}
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
              wsConnected 
                ? 'bg-neutral-900 text-emerald-400 border-neutral-700' 
                : 'bg-neutral-900 text-red-400 border-neutral-800 animate-pulse'
            }`}>
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span>{wsConnected ? 'OSRM LIVE' : 'CONNECTING...'}</span>
            </div>

            {/* User Session Profile */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 pl-3 pr-1 py-1 rounded-full">
                <div className="text-right">
                  <p className="text-xs font-bold text-white leading-none">
                    {currentUser.full_name || currentUser.username}
                  </p>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {currentUser.role === 'ADMIN' ? '👑 Admin' : currentUser.role === 'DRIVER' ? '🚗 Driver' : '🛡️ Security'}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-white hover:bg-neutral-200 text-black text-xs font-bold px-3.5 py-1.5 rounded-full transition"
              >
                Log in
              </button>
            )}
          </div>
        </div>

        {/* Uber Minimal Navigation Tabs — RBAC controlled */}
        <div className="flex space-x-1.5 mt-3 border-t border-neutral-800/80 pt-2.5 overflow-x-auto scrollbar-none">

          {/* Security tab: hidden for DRIVER */}
          {currentUser?.role !== 'DRIVER' && (
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition ${
                activeTab === 'security'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Security Dispatch</span>
            </button>
          )}

          {/* Driver tab: always visible */}
          <button
            onClick={() => setActiveTab('driver')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition ${
              activeTab === 'driver'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Driver &amp; Live GPS</span>
          </button>

          {/* Zones tab: hidden for DRIVER */}
          {currentUser?.role !== 'DRIVER' && (
            <button
              onClick={() => setActiveTab('zones')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition ${
                activeTab === 'zones'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Geofence Studio</span>
            </button>
          )}

          {/* Audit tab: hidden for DRIVER */}
          {currentUser?.role !== 'DRIVER' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition ${
                activeTab === 'audit'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Incidents &amp; Audit</span>
            </button>
          )}

          {/* Admin tab: only for ADMIN */}
          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition ${
                activeTab === 'admin'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
