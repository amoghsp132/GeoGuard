import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  Navigation, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Gauge, 
  Compass, 
  Play, 
  Pause, 
  RotateCcw, 
  StepForward, 
  Radio, 
  Crosshair, 
  Send, 
  Clock, 
  Volume2, 
  VolumeX, 
  Power,
  ChevronUp,
  MapPin,
  Car
} from 'lucide-react';
import { sendLocationPing, playAlertTone } from '../api';

const uberCarMarkerIcon = L.divIcon({
  className: 'uber-driver-car-marker',
  html: `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      <div style="width: 28px; height: 28px; border-radius: 9999px; background: #000000; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.6);">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
          <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function MiniMapPinger({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function DriverHUD({ 
  presetRoutes, 
  zones = [],
  selectedVehicleNumber = 'KA-25-EA-1024',
  driverAlert,
  soundEnabled,
  setSoundEnabled,
  onLocationSent
}) {
  const [selectedRouteId, setSelectedRouteId] = useState('sdmcet_cantonment_breach');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(2500);

  const [isOnline, setIsOnline] = useState(true);
  const [deviceGpsActive, setDeviceGpsActive] = useState(false);
  const [deviceGpsError, setDeviceGpsError] = useState('');
  const [deviceCoords, setDeviceCoords] = useState(null);
  const [deviceAccuracy, setDeviceAccuracy] = useState(null);
  const watchIdRef = useRef(null);

  const [manualLat, setManualLat] = useState('15.4450');
  const [manualLng, setManualLng] = useState('75.0065');
  const [manualSpeed, setManualSpeed] = useState('42');

  const [currentCarPos, setCurrentCarPos] = useState([15.4485, 75.0020]);
  const [routeGeometry, setRouteGeometry] = useState([]);

  const [hudState, setHudState] = useState({
    status: 'NORMAL',
    speed: 42.0,
    heading: 135.0,
    distance_to_boundary: 1250,
    eta_seconds: 140,
    zone_name: 'Dharwad Cantonment Security Zone',
    alert_message: null,
    is_osrm_calculated: true,
  });

  const activeRoute = presetRoutes.find(r => r.id === selectedRouteId) || presetRoutes[0];
  const timerRef = useRef(null);

  useEffect(() => {
    if (driverAlert) {
      setHudState(prev => ({
        ...prev,
        status: driverAlert.status,
        distance_to_boundary: driverAlert.distance_to_boundary,
        eta_seconds: driverAlert.eta_seconds,
        zone_name: driverAlert.zone_name || prev.zone_name,
        alert_message: driverAlert.alert_message,
        is_osrm_calculated: driverAlert.is_osrm_calculated ?? true,
      }));

      if (driverAlert.latitude && driverAlert.longitude) {
        setCurrentCarPos([driverAlert.latitude, driverAlert.longitude]);
      }

      // Update OSRM route geometry from WebSocket payload
      if (driverAlert.route_geometry && driverAlert.route_geometry.length >= 2) {
        setRouteGeometry(driverAlert.route_geometry);
      }

      if (soundEnabled) {
        if (driverAlert.status === 'VIOLATION_INSIDE') {
          playAlertTone('violation');
        } else if (driverAlert.status === 'APPROACHING_WARNING') {
          playAlertTone('warning');
        }
      }
    }
  }, [driverAlert, soundEnabled]);

  const dispatchGpsPing = async (lat, lng, speed = 35.0, heading = 120.0) => {
    setCurrentCarPos([lat, lng]);
    setHudState(prev => ({ ...prev, speed, heading }));

    try {
      const resp = await sendLocationPing({
        vehicle_number: selectedVehicleNumber,
        latitude: lat,
        longitude: lng,
        speed: speed,
        heading: heading
      });

      if (resp) {
        setHudState(prev => ({
          ...prev,
          status: resp.status,
          distance_to_boundary: resp.distance_to_boundary,
          eta_seconds: resp.eta_seconds,
          zone_name: resp.zone_name || prev.zone_name,
          alert_message: resp.alert_message,
          is_osrm_calculated: resp.is_osrm_calculated,
        }));

        // Store OSRM route geometry for polyline rendering on mini-map
        if (resp.route_geometry && resp.route_geometry.length >= 2) {
          setRouteGeometry(resp.route_geometry);
        } else {
          setRouteGeometry([]);
        }

        if (soundEnabled) {
          if (resp.status === 'VIOLATION_INSIDE') {
            playAlertTone('violation');
          } else if (resp.status === 'APPROACHING_WARNING') {
            playAlertTone('warning');
          }
        }

        onLocationSent && onLocationSent(resp);
      }
    } catch (err) {
      console.error('Error sending GPS ping:', err);
    }
  };

  // Real Hardware GPS Watcher
  useEffect(() => {
    if (deviceGpsActive) {
      if (!navigator.geolocation) {
        setDeviceGpsError('Geolocation is not supported by your browser.');
        setDeviceGpsActive(false);
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          const speed = position.coords.speed ? (position.coords.speed * 3.6) : 32.0;
          const heading = position.coords.heading || 0.0;

          setDeviceCoords({ lat, lng });
          setDeviceAccuracy(accuracy);
          setDeviceGpsError('');

          dispatchGpsPing(lat, lng, speed, heading);
        },
        (error) => {
          setDeviceGpsError(error.message);
          setDeviceGpsActive(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [deviceGpsActive]);

  // Simulation execution
  const executeStep = (stepIndex) => {
    if (!activeRoute?.waypoints?.[stepIndex]) return;
    const wp = activeRoute.waypoints[stepIndex];
    dispatchGpsPing(wp.lat, wp.lng, wp.speed, wp.heading);
  };

  useEffect(() => {
    if (isPlaying && isOnline) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          const next = prev + 1;
          if (activeRoute && next < activeRoute.waypoints.length) {
            executeStep(next);
            return next;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, simSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, isOnline, activeRoute, simSpeed]);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
      {/* Uber Driver App In-Cabin Top Navigation Banner */}
      <div className={`rounded-3xl p-6 transition-all duration-300 shadow-2xl relative overflow-hidden ${
        hudState.status === 'VIOLATION_INSIDE' 
          ? 'bg-red-600 text-white' 
          : hudState.status === 'APPROACHING_WARNING'
          ? 'bg-amber-400 text-black'
          : 'bg-neutral-900 border border-neutral-800 text-white'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-start space-x-4">
            <div className={`p-3.5 rounded-2xl shrink-0 ${
              hudState.status === 'VIOLATION_INSIDE' ? 'bg-black text-white' :
              hudState.status === 'APPROACHING_WARNING' ? 'bg-black text-amber-400' :
              'bg-black text-white'
            }`}>
              <Navigation className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-black tracking-widest opacity-80">
                  {hudState.status === 'VIOLATION_INSIDE' ? '🚨 CRITICAL RESTRICTED AREA BREACH' :
                   hudState.status === 'APPROACHING_WARNING' ? '⚠️ RESTRICTED ZONE AHEAD' :
                   'TURN-BY-TURN ROUTING SECURE'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/30 font-bold">
                  {selectedVehicleNumber}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-1">
                {hudState.status === 'VIOLATION_INSIDE'
                  ? `RESTRICTED ZONE BREACH: ${hudState.zone_name}`
                  : hudState.status === 'APPROACHING_WARNING'
                  ? `In ${hudState.distance_to_boundary?.toFixed(0)}m, DO NOT ENTER ${hudState.zone_name}`
                  : 'Transit Clear • Permitted Public Corridor'}
              </h2>

              <p className="text-xs sm:text-sm font-semibold mt-1 opacity-90">
                {hudState.status === 'VIOLATION_INSIDE'
                  ? 'Security control center notified. Permanent timestamped audit violation logged.'
                  : hudState.status === 'APPROACHING_WARNING'
                  ? `OSRM computed ETA: ${Math.round(hudState.eta_seconds || 0)}s to perimeter along road network.`
                  : `Next sensitive perimeter: ${hudState.distance_to_boundary ? `${hudState.distance_to_boundary.toFixed(0)}m along road` : 'Far'}.`}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 bg-black/40 hover:bg-black/60 rounded-full transition text-white"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-60" />}
            </button>

            <span className="text-xs font-mono font-bold bg-black/30 px-3 py-1 rounded-full">
              {hudState.is_osrm_calculated ? 'OSRM 5Hz' : 'Geodesic Snap'}
            </span>
          </div>

        </div>
      </div>

      {/* Uber Driver Instrument Cluster (Speedometer & Controls) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Speedometer Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xl">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Speed</p>
          <div className="my-2 flex items-baseline">
            <span className="text-6xl font-black text-white tracking-tighter">
              {hudState.speed?.toFixed(0)}
            </span>
            <span className="text-sm font-bold text-neutral-400 ml-1">km/h</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-neutral-400 font-medium">
            <Compass className="w-3.5 h-3.5" />
            <span>Heading: {hudState.heading?.toFixed(0)}°</span>
          </div>
        </div>

        {/* Road Distance & ETA to Boundary */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xl">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Distance to Perimeter</p>
          <div className="my-2 flex items-baseline">
            <span className="text-6xl font-black text-amber-400 tracking-tighter">
              {hudState.distance_to_boundary !== null && hudState.distance_to_boundary !== undefined
                ? hudState.distance_to_boundary.toFixed(0)
                : '--'}
            </span>
            <span className="text-sm font-bold text-neutral-400 ml-1">meters</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>ETA: {hudState.eta_seconds ? `${Math.round(hudState.eta_seconds)}s` : '--'}</span>
          </div>
        </div>

        {/* Uber Driver Status & Online Toggle */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                {isOnline ? "YOU'RE ONLINE" : "YOU'RE OFFLINE"}
              </span>
            </div>

            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`p-2 rounded-full transition ${
                isOnline ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
              }`}
            >
              <Power className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-neutral-400 my-2">
            Telematics reporting active. GPS coordinates evaluated continuously against restricted polygon boundaries.
          </p>

          <button
            onClick={() => {
              if (deviceGpsActive) {
                setDeviceGpsActive(false);
              } else {
                setIsPlaying(false);
                setDeviceGpsActive(true);
              }
            }}
            className={`w-full py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              deviceGpsActive 
                ? 'bg-red-600 hover:bg-red-500 text-white' 
                : 'bg-white hover:bg-neutral-200 text-black'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>{deviceGpsActive ? 'Stop Phone Live GPS' : 'Stream My Phone Live GPS'}</span>
          </button>
        </div>

      </div>

      {/* Uber Route Simulator & Interactive Testing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Pre-mapped Route Simulator */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white">Demonstration Route Simulator</h3>
            </div>
            
            <select
              value={selectedRouteId}
              onChange={(e) => {
                setSelectedRouteId(e.target.value);
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              className="bg-neutral-900 border border-neutral-800 text-white text-xs rounded-xl px-3 py-1.5 font-medium focus:outline-none"
            >
              {presetRoutes.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-neutral-400 font-medium">
            {activeRoute?.description}
          </p>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-neutral-400 font-mono">
              <span>Waypoint {currentStep + 1} / {activeRoute?.waypoints?.length || 0}</span>
              <span>{hudState.speed?.toFixed(0)} km/h • {hudState.heading?.toFixed(0)}°</span>
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-800">
              <div 
                className="bg-white h-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / (activeRoute?.waypoints?.length || 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 pt-2">
            {!isPlaying ? (
              <button
                onClick={() => {
                  setDeviceGpsActive(false);
                  setIsPlaying(true);
                  executeStep(currentStep);
                }}
                className="bg-white hover:bg-neutral-200 text-black text-xs font-bold px-5 py-2.5 rounded-full transition flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Route</span>
              </button>
            ) : (
              <button
                onClick={() => setIsPlaying(false)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold px-5 py-2.5 rounded-full transition flex items-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={() => {
                const next = Math.min(currentStep + 1, (activeRoute?.waypoints?.length || 1) - 1);
                setCurrentStep(next);
                executeStep(next);
              }}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white text-xs font-semibold px-4 py-2.5 rounded-full transition"
            >
              <StepForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(0);
                if (activeRoute?.waypoints?.length > 0) executeStep(0);
              }}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-full transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Interactive Click-to-Ping Mini Map */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <Crosshair className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">Click Map to Test Geofence</h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">Click anywhere</span>
            </div>

            <p className="text-xs text-neutral-400 mt-2">
              Click anywhere on roads or inside restricted zones to immediately test the boundary response.
            </p>

            <div className="mt-3 h-40 w-full rounded-2xl overflow-hidden border border-neutral-800 relative">
              <MapContainer
                center={currentCarPos}
                zoom={13}
                scrollWheelZoom={false}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; OSM'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MiniMapPinger onMapClick={(lat, lng) => {
                  setIsPlaying(false);
                  setDeviceGpsActive(false);
                  dispatchGpsPing(lat, lng, 35.0, 110.0);
                }} />
                
                {zones.filter(z => z.is_active).map(z => (
                  <Polygon 
                    key={z.id} 
                    positions={z.coordinates} 
                    pathOptions={{ color: z.color || '#ef4444', fillOpacity: 0.3, weight: 2 }} 
                  />
                ))}

                {/* OSRM route polyline: vehicle → nearest zone boundary */}
                {routeGeometry.length >= 2 && (
                  <Polyline
                    positions={routeGeometry}
                    pathOptions={{
                      color: hudState.status === 'APPROACHING_WARNING' ? '#ffc043' :
                             hudState.status === 'VIOLATION_INSIDE' ? '#e11900' : '#ffffff',
                      weight: 2.5,
                      opacity: 0.9,
                      dashArray: hudState.status === 'APPROACHING_WARNING' ? '7 5' : null,
                    }}
                  />
                )}

                <Marker position={currentCarPos} icon={uberCarMarkerIcon} />
              </MapContainer>
            </div>
          </div>

          <div className="pt-3 flex justify-between text-[11px] text-neutral-500 font-mono">
            <span>Lat: {currentCarPos[0].toFixed(5)}</span>
            <span>Lng: {currentCarPos[1].toFixed(5)}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
