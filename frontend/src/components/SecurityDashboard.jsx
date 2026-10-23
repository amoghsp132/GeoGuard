import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  ShieldAlert, 
  Car, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  Clock, 
  Zap,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { acknowledgeViolation, resolveViolation } from '../api';

const DHARWAD_CENTER = [15.4460, 75.0110];

function createUberVehicleIcon(status, heading = 0) {
  let bgColor = '#000000';
  let pulseClass = '';
  let borderColor = '#ffffff';

  if (status === 'VIOLATION_INSIDE') {
    bgColor = '#e11900';
    borderColor = '#ffffff';
    pulseClass = 'pulsing-violation';
  } else if (status === 'APPROACHING_WARNING') {
    bgColor = '#ffc043';
    borderColor = '#000000';
    pulseClass = 'pulsing-warning';
  }

  const html = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div class="${pulseClass}" style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background-color: ${bgColor}44;"></div>
      <div style="
        width: 26px; 
        height: 26px; 
        border-radius: 9999px; 
        background: ${bgColor}; 
        color: ${status === 'APPROACHING_WARNING' ? '#000000' : '#ffffff'}; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.6);
        border: 2px solid ${borderColor};
        transform: rotate(${heading}deg);
        transition: transform 0.25s ease;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${status === 'APPROACHING_WARNING' ? '#000000' : '#ffffff'}">
          <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-uber-vehicle-marker',
    html: html,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
}

export default function SecurityDashboard({ 
  stats, 
  zones, 
  vehicles, 
  violations, 
  latestAlert, 
  soundEnabled, 
  setSoundEnabled,
  onRefresh
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredViolations = violations.filter(v => {
    if (filterStatus === 'ALL') return true;
    return v.status === filterStatus;
  });

  const handleAcknowledge = async (id) => {
    await acknowledgeViolation(id);
    onRefresh && onRefresh();
  };

  const handleResolve = async (id) => {
    await resolveViolation(id);
    onRefresh && onRefresh();
  };

  return (
    <div className="space-y-4 font-sans">
      
      {/* Top Uber Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-4 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Vehicles Monitored</p>
            <p className="text-3xl font-black text-white tracking-tight mt-0.5">{vehicles.length}</p>
            <p className="text-[10px] text-neutral-400 mt-1 font-medium">Active SIM/GPS</p>
          </div>
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-white">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-4 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Restricted Zones</p>
            <p className="text-3xl font-black text-white tracking-tight mt-0.5">{zones.filter(z => z.is_active).length}</p>
            <p className="text-[10px] text-neutral-400 mt-1 font-medium">OSRM Monitored</p>
          </div>
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-white">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-4 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Approaching Warnings</p>
            <p className="text-3xl font-black text-amber-400 tracking-tight mt-0.5">
              {vehicles.filter(v => v.current_status === 'APPROACHING_WARNING').length}
            </p>
            <p className="text-[10px] text-amber-400/90 mt-1 font-medium">&lt;500m Road Buffer</p>
          </div>
          <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-4 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Active Breaches</p>
            <p className="text-3xl font-black text-red-500 tracking-tight mt-0.5">
              {violations.filter(v => v.status === 'ACTIVE').length}
            </p>
            <p className="text-[10px] text-red-400 mt-1 font-medium">Perimeter Violations</p>
          </div>
          <div className="p-3 bg-red-600/10 border border-red-600/30 rounded-2xl text-red-500">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Real-time Alert Banner */}
      {latestAlert && (
        <div className={`p-4 rounded-3xl border transition shadow-2xl flex items-center justify-between ${
          latestAlert.status === 'VIOLATION_INSIDE'
            ? 'bg-red-950/80 border-red-600 text-white animate-pulse'
            : 'bg-neutral-900 border-amber-400 text-amber-300'
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className={`p-2.5 rounded-2xl ${latestAlert.status === 'VIOLATION_INSIDE' ? 'bg-red-600 text-white' : 'bg-amber-400 text-black'}`}>
              {latestAlert.status === 'VIOLATION_INSIDE' ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest opacity-80">
                {latestAlert.status === 'VIOLATION_INSIDE' ? 'CRITICAL GEOFENCE BREACH' : 'PROXIMITY WARNING ALERT'}
              </p>
              <p className="text-sm font-bold">
                {latestAlert.alert_message || `Vehicle ${latestAlert.vehicle_number} updated status to ${latestAlert.status}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-full text-white transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
          </button>
        </div>
      )}

      {/* Main Grid: Tactical Map & Incident Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Map Panel (2 Cols) */}
        <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[600px]">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-sm font-bold text-white tracking-wide">Live Road Network & Geofences</h2>
            </div>

            <button 
              onClick={onRefresh}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex-1 w-full rounded-2xl overflow-hidden relative border border-neutral-800">
            <MapContainer
              center={DHARWAD_CENTER}
              zoom={14}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; OSM'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Zones */}
              {zones.filter(z => z.is_active).map(zone => (
                <Polygon
                  key={zone.id}
                  positions={zone.coordinates}
                  pathOptions={{
                    color: zone.color || '#e11900',
                    fillColor: zone.color || '#e11900',
                    fillOpacity: 0.22,
                    weight: 2
                  }}
                >
                  <Tooltip sticky>
                    <div className="text-xs p-1">
                      <p className="font-bold text-black">{zone.name}</p>
                      <p className="text-neutral-600">{zone.zone_type} • Threshold: {zone.warning_threshold_meters}m</p>
                    </div>
                  </Tooltip>
                </Polygon>
              ))}

              {/* Vehicles */}
              {vehicles.map(v => {
                if (!v.current_latitude || !v.current_longitude) return null;
                const pos = [v.current_latitude, v.current_longitude];
                const icon = createUberVehicleIcon(v.current_status, v.current_heading || 0);

                return (
                  <Marker key={v.id} position={pos} icon={icon}>
                    <Popup>
                      <div className="p-2 space-y-1 text-xs">
                        <div className="flex items-center justify-between border-b border-neutral-700 pb-1">
                          <span className="font-bold text-white">{v.vehicle_number}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.current_status === 'VIOLATION_INSIDE' ? 'bg-red-600 text-white' :
                            v.current_status === 'APPROACHING_WARNING' ? 'bg-amber-400 text-black' :
                            'bg-neutral-800 text-white'
                          }`}>
                            {v.current_status}
                          </span>
                        </div>
                        <p><strong className="text-neutral-400">Driver:</strong> {v.driver_name}</p>
                        <p><strong className="text-neutral-400">Speed:</strong> {v.current_speed?.toFixed(1)} km/h</p>
                        {v.distance_to_nearest_zone !== null && (
                          <p className="text-amber-400 font-bold">
                            Road Distance: {v.distance_to_nearest_zone?.toFixed(0)}m
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {/* Uber-style Map Legend */}
            <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 text-[11px] text-neutral-300 shadow-2xl z-[1000] space-y-1.5 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                <span>Normal Transit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                <span>Approaching (&lt;500m OSRM)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <span>Perimeter Violation Inside</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Incident Queue (1 Col) */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[600px]">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h2 className="text-sm font-bold text-white tracking-wide">Incident Dispatch Feed</h2>
            
            <div className="flex space-x-1 text-[11px]">
              {['ALL', 'ACTIVE', 'ACKNOWLEDGED'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2.5 py-1 rounded-full font-bold transition ${
                    filterStatus === status 
                      ? 'bg-white text-black' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1">
            {filteredViolations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mb-2 opacity-80" />
                <p className="text-sm font-bold text-white">All Corridors Clear</p>
                <p className="text-xs text-neutral-500 mt-1">No active violations detected.</p>
              </div>
            ) : (
              filteredViolations.map(violation => (
                <div 
                  key={violation.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    violation.status === 'ACTIVE' 
                      ? 'bg-red-950/40 border-red-600/70 text-white' 
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-neutral-400" />
                      {violation.vehicle_number}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      violation.status === 'ACTIVE' ? 'bg-red-600 text-white animate-pulse' :
                      violation.status === 'ACKNOWLEDGED' ? 'bg-amber-400 text-black' :
                      'bg-neutral-800 text-neutral-300'
                    }`}>
                      {violation.status}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-neutral-200 mt-1">
                    Zone: {violation.zone_name}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(violation.timestamp).toLocaleTimeString()}
                    </span>
                    <span>Speed: {violation.speed?.toFixed(1)} km/h</span>
                  </div>

                  {violation.status === 'ACTIVE' && (
                    <div className="flex space-x-2 mt-3 pt-2.5 border-t border-red-900/40">
                      <button
                        onClick={() => handleAcknowledge(violation.id)}
                        className="flex-1 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold py-1.5 px-3 rounded-full transition"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleResolve(violation.id)}
                        className="flex-1 bg-white hover:bg-neutral-200 text-black text-xs font-bold py-1.5 px-3 rounded-full transition"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
