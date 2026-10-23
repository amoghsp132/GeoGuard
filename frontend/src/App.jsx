import React, { useState, useEffect, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import SecurityDashboard from './components/SecurityDashboard';
import DriverHUD from './components/DriverHUD';
import ZoneStudio from './components/ZoneStudio';
import AuditTrail from './components/AuditTrail';
import { 
  fetchStats, 
  fetchZones, 
  fetchVehicles, 
  fetchViolations, 
  fetchPresetRoutes,
  createSecurityWebSocket,
  createDriverWebSocket,
  playAlertTone
} from './api';

export default function App() {
  // Navigation View: 'landing' | 'signup' | 'login' | 'dashboard'
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('restricted_zone_user') ? 'dashboard' : 'landing';
  });

  const [activeTab, setActiveTab] = useState('security');
  const [stats, setStats] = useState(null);
  const [zones, setZones] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [violations, setViolations] = useState([]);
  const [presetRoutes, setPresetRoutes] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [latestAlert, setLatestAlert] = useState(null);
  const [driverAlert, setDriverAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Authentication state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('restricted_zone_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('restricted_zone_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('restricted_zone_user');
    } catch (e) {
      console.error(e);
    }
    setCurrentView('landing');
  };

  const handleQuickDemo = () => {
    const demoUser = {
      id: 1,
      username: 'admin',
      full_name: 'Dr. S. B. Kulkarni (Admin)',
      role: 'ADMIN',
      assigned_vehicle_number: 'KA-25-EA-1024'
    };
    handleAuthSuccess(demoUser);
  };

  // Reload all data
  const loadAllData = useCallback(async () => {
    try {
      const [sData, zData, vData, violData, rData] = await Promise.all([
        fetchStats().catch(() => null),
        fetchZones().catch(() => []),
        fetchVehicles().catch(() => []),
        fetchViolations().catch(() => []),
        fetchPresetRoutes().catch(() => [])
      ]);

      if (sData) setStats(sData);
      if (zData) setZones(zData);
      if (vData) setVehicles(vData);
      if (violData) setViolations(violData);
      if (rData) setPresetRoutes(rData);
    } catch (err) {
      console.error('Error fetching initial system data:', err);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'dashboard') {
      loadAllData();
    }
  }, [currentView, loadAllData]);

  // Connect WebSockets when on Dashboard
  useEffect(() => {
    if (currentView !== 'dashboard') return;

    // 1. Security Room Broadcast
    const secSocket = createSecurityWebSocket(
      (msg) => {
        if (msg.type === 'CONNECTION_ESTABLISHED') {
          setWsConnected(true);
        } else if (msg.type === 'VEHICLE_UPDATE') {
          const update = msg.data;
          
          setVehicles(prev => {
            const index = prev.findIndex(v => v.id === update.vehicle_id || v.vehicle_number === update.vehicle_number);
            const updatedVehicle = {
              id: update.vehicle_id,
              vehicle_number: update.vehicle_number,
              driver_name: update.driver_name,
              current_latitude: update.latitude,
              current_longitude: update.longitude,
              current_speed: update.speed,
              current_heading: update.heading,
              current_status: update.status,
              distance_to_nearest_zone: update.distance_to_boundary,
              eta_to_nearest_zone: update.eta_seconds,
              last_ping_time: update.timestamp,
            };

            if (index >= 0) {
              const copy = [...prev];
              copy[index] = { ...copy[index], ...updatedVehicle };
              return copy;
            } else {
              return [...prev, updatedVehicle];
            }
          });

          // Handle Alerts
          if (update.status === 'VIOLATION_INSIDE' || update.status === 'APPROACHING_WARNING') {
            setLatestAlert(update);
            if (soundEnabled) {
              playAlertTone(update.status === 'VIOLATION_INSIDE' ? 'violation' : 'warning');
            }
            fetchViolations().then(v => setViolations(v)).catch(() => {});
            fetchStats().then(s => setStats(s)).catch(() => {});
          }
        }
      },
      () => setWsConnected(true),
      () => setWsConnected(false)
    );

    // 2. Driver Companion WebSocket
    const vehNum = currentUser?.assigned_vehicle_number || 'KA-25-EA-1024';
    const driverSocket = createDriverWebSocket(
      vehNum,
      (msg) => {
        if (msg.type === 'HUD_ALERT') {
          setDriverAlert(msg.data);
        }
      },
      () => {},
      () => {}
    );

    return () => {
      if (secSocket) secSocket.close();
      if (driverSocket) driverSocket.close();
    };
  }, [currentView, soundEnabled, currentUser]);

  // 1. Landing Page View
  if (currentView === 'landing') {
    return (
      <LandingPage
        onGoToSignup={() => setCurrentView('signup')}
        onGoToLogin={() => setCurrentView('login')}
        onQuickDemo={handleQuickDemo}
      />
    );
  }

  // 2. Signup Page View
  if (currentView === 'signup') {
    return (
      <SignupPage
        onGoToLogin={() => setCurrentView('login')}
        onGoToLanding={() => setCurrentView('landing')}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // 3. Login Page View
  if (currentView === 'login') {
    return (
      <LoginPage
        onGoToSignup={() => setCurrentView('signup')}
        onGoToLanding={() => setCurrentView('landing')}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // 4. Main Project Page / Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navbar Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        wsConnected={wsConnected} 
        stats={stats} 
        currentUser={currentUser}
        onOpenAuth={() => setCurrentView('login')}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        {activeTab === 'security' && (
          <SecurityDashboard
            stats={stats}
            zones={zones}
            vehicles={vehicles}
            violations={violations}
            latestAlert={latestAlert}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'driver' && (
          <DriverHUD
            presetRoutes={presetRoutes}
            zones={zones}
            selectedVehicleNumber={currentUser?.assigned_vehicle_number || 'KA-25-EA-1024'}
            driverAlert={driverAlert}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            onLocationSent={(res) => {
              if (res && res.status !== 'NORMAL') {
                setLatestAlert(res);
              }
              loadAllData();
            }}
          />
        )}

        {activeTab === 'zones' && (
          <ZoneStudio
            zones={zones}
            onRefreshZones={loadAllData}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTrail
            violations={violations}
            onRefresh={loadAllData}
          />
        )}
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/60 py-3 mt-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-slate-400">
            SDM College of Engineering & Technology, Dharwad • <span className="text-slate-300 font-semibold">VII Sem Major Project - I</span>
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentView('landing')}
              className="text-slate-400 hover:text-white underline underline-offset-2"
            >
              Landing Overview
            </button>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500 font-mono text-[11px]">
              Guide: Dr. S. B. Kulkarni
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
