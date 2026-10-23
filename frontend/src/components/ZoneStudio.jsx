import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Check, 
  RotateCcw, 
  Layers, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { createZone, deleteZone, seedDemoData } from '../api';

const DHARWAD_CENTER = [15.4460, 75.0110];

const vertexIcon = L.divIcon({
  className: 'uber-vertex-marker',
  html: `<div style="width: 12px; height: 12px; border-radius: 9999px; background: #ffffff; border: 2px solid #000000; box-shadow: 0 0 6px rgba(0,0,0,0.6);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

function PolygonDrawer({ isDrawing, vertices, onAddVertex }) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onAddVertex([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
}

export default function ZoneStudio({ zones, onRefreshZones }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [newVertices, setNewVertices] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    zone_type: 'CANTONMENT',
    severity: 'HIGH',
    warning_threshold_meters: 500.0,
    color: '#e11900'
  });
  const [saving, setSaving] = useState(false);

  const handleAddVertex = (latlng) => {
    setNewVertices(prev => [...prev, latlng]);
  };

  const handleUndo = () => {
    setNewVertices(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setNewVertices([]);
    setIsDrawing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (newVertices.length < 3) {
      alert('Click at least 3 points on the road network to define the restricted zone.');
      return;
    }

    if (!formData.name) {
      alert('Please specify a Zone Name.');
      return;
    }

    setSaving(true);
    try {
      const closedCoords = [...newVertices, newVertices[0]];
      await createZone({
        ...formData,
        coordinates: closedCoords,
        warning_threshold_meters: parseFloat(formData.warning_threshold_meters),
        is_active: true
      });
      handleClear();
      setFormData({
        name: '',
        description: '',
        zone_type: 'CANTONMENT',
        severity: 'HIGH',
        warning_threshold_meters: 500.0,
        color: '#e11900'
      });
      onRefreshZones && onRefreshZones();
    } catch (err) {
      console.error('Error saving zone:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this restricted zone?')) {
      await deleteZone(id);
      onRefreshZones && onRefreshZones();
    }
  };

  const handleReseed = async () => {
    await seedDemoData();
    onRefreshZones && onRefreshZones();
  };

  return (
    <div className="space-y-4 font-sans">
      
      {/* Top Banner */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-white" />
            Restricted Geofence Studio
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Define polygon perimeters on the road network and calibrate OSRM proximity buffers.
          </p>
        </div>

        <button
          onClick={handleReseed}
          className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Reload SDMCET Demo Zones</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Map Panel */}
        <div className="lg:col-span-2 bg-neutral-950 border border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[600px]">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {isDrawing ? 'Drawing Active: Click on map to add points' : 'Interactive Road Map'}
            </span>

            {!isDrawing ? (
              <button
                onClick={() => setIsDrawing(true)}
                className="bg-white hover:bg-neutral-200 text-black text-xs font-bold px-4 py-2 rounded-full transition shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Draw New Zone</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-amber-400 font-mono">Points: {newVertices.length}</span>
                <button onClick={handleUndo} className="px-3 py-1 bg-neutral-800 text-white rounded-full text-xs font-semibold">Undo</button>
                <button onClick={handleClear} className="px-3 py-1 bg-neutral-800 text-red-400 rounded-full text-xs font-semibold">Cancel</button>
              </div>
            )}
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

              <PolygonDrawer
                isDrawing={isDrawing}
                vertices={newVertices}
                onAddVertex={handleAddVertex}
              />

              {zones.map(zone => (
                <Polygon
                  key={zone.id}
                  positions={zone.coordinates}
                  pathOptions={{
                    color: zone.color || '#e11900',
                    fillColor: zone.color || '#e11900',
                    fillOpacity: 0.22,
                    weight: 2
                  }}
                />
              ))}

              {newVertices.length > 0 && (
                <>
                  {newVertices.map((pt, idx) => (
                    <Marker key={idx} position={pt} icon={vertexIcon} />
                  ))}
                  {newVertices.length >= 3 && (
                    <Polygon
                      positions={[...newVertices, newVertices[0]]}
                      pathOptions={{
                        color: formData.color,
                        fillColor: formData.color,
                        fillOpacity: 0.4,
                        dashArray: '5, 5',
                        weight: 2.5
                      }}
                    />
                  )}
                </>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Form or List (1 Col) */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[600px] overflow-hidden">
          {isDrawing ? (
            <form onSubmit={handleSave} className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              <h3 className="text-sm font-bold text-white border-b border-neutral-800 pb-2">
                Configure Restricted Geofence
              </h3>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SDMCET Defense Lab Corridor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">Category</label>
                <select
                  value={formData.zone_type}
                  onChange={(e) => setFormData({ ...formData, zone_type: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-white"
                >
                  <option value="CANTONMENT">Cantonment / Military Zone</option>
                  <option value="DISASTER_AREA">Disaster Hit Area</option>
                  <option value="VIP_CORRIDOR">VIP Movement Corridor</option>
                  <option value="CAMPUS_RESTRICTED">Campus Restricted Zone</option>
                  <option value="GENERAL">General Restricted Zone</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 block mb-1 uppercase tracking-wider">Warning Threshold (m)</label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  step="50"
                  value={formData.warning_threshold_meters}
                  onChange={(e) => setFormData({ ...formData, warning_threshold_meters: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl px-3 py-2.5 text-xs focus:outline-none focus:border-white"
                />
              </div>

              <button
                type="submit"
                disabled={saving || newVertices.length < 3}
                className="w-full bg-white hover:bg-neutral-200 text-black font-bold text-xs py-3.5 rounded-2xl transition shadow flex items-center justify-center gap-1.5 mt-4"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Geofence'}</span>
              </button>
            </form>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-sm font-bold text-white">Active Zones ({zones.length})</h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
                {zones.map(zone => (
                  <div key={zone.id} className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-white">{zone.name}</p>
                      <button onClick={() => handleDelete(zone.id)} className="text-neutral-400 hover:text-red-400 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 font-mono">
                      <span>{zone.zone_type}</span>
                      <span>Buffer: <strong className="text-amber-400">{zone.warning_threshold_meters}m</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
