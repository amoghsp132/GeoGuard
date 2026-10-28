const API_BASE = 'http://localhost:8000/api';
const WS_BASE = 'ws://localhost:8000/ws';

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed');
  }
  return res.json();
}

export async function registerUser(userData) {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Registration failed');
  }
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats/`);
  return res.json();
}

export async function fetchZones() {
  const res = await fetch(`${API_BASE}/zones/`);
  return res.json();
}

export async function createZone(zoneData) {
  const res = await fetch(`${API_BASE}/zones/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(zoneData)
  });
  return res.json();
}

export async function deleteZone(id) {
  const res = await fetch(`${API_BASE}/zones/${id}/`, {
    method: 'DELETE'
  });
  return res.ok;
}

export async function fetchVehicles() {
  const res = await fetch(`${API_BASE}/vehicles/`);
  return res.json();
}

export async function fetchViolations(status = '') {
  const url = status ? `${API_BASE}/violations/?status=${status}` : `${API_BASE}/violations/`;
  const res = await fetch(url);
  return res.json();
}

export async function acknowledgeViolation(id, notes = 'Acknowledged by security desk') {
  const res = await fetch(`${API_BASE}/violations/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ACKNOWLEDGED', security_notes: notes })
  });
  return res.json();
}

export async function resolveViolation(id, notes = 'Resolved and vehicle escorted out') {
  const res = await fetch(`${API_BASE}/violations/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'RESOLVED', security_notes: notes })
  });
  return res.json();
}

export async function sendLocationPing(locationData) {
  const res = await fetch(`${API_BASE}/vehicles/location/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(locationData)
  });
  return res.json();
}

export async function fetchPresetRoutes() {
  const res = await fetch(`${API_BASE}/simulation/routes/`);
  return res.json();
}

export async function seedDemoData() {
  const res = await fetch(`${API_BASE}/seed-demo-data/`, { method: 'POST' });
  return res.json();
}

export function createSecurityWebSocket(onMessage, onOpen, onError) {
  let socket = null;
  try {
    socket = new WebSocket(`${WS_BASE}/security/`);
    socket.onopen = () => onOpen && onOpen();
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage && onMessage(data);
      } catch (e) {
        console.error('Error parsing WS message', e);
      }
    };
    socket.onerror = (e) => onError && onError(e);
  } catch (err) {
    console.error('Failed to connect to Security WS', err);
  }
  return socket;
}

export function createDriverWebSocket(vehicleNumber, onMessage, onOpen, onError) {
  let socket = null;
  try {
    const safeNum = encodeURIComponent(vehicleNumber);
    socket = new WebSocket(`${WS_BASE}/driver/${safeNum}/`);
    socket.onopen = () => onOpen && onOpen();
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage && onMessage(data);
      } catch (e) {
        console.error('Error parsing Driver WS message', e);
      }
    };
    socket.onerror = (e) => onError && onError(e);
  } catch (err) {
    console.error('Failed to connect to Driver WS', err);
  }
  return socket;
}

// Built-in Web Audio Alert Sound Generator (synthesizes warning beep or violation siren)
export function playAlertTone(type = 'warning') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'violation') {
      // High-pitched pulsing siren
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else {
      // Double beep for proximity warning
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.debug('Audio playback note:', e);
  }
}

// ── Admin API helpers ────────────────────────────────────────────────────────

export async function fetchAdminUsers() {
  const res = await fetch(`${API_BASE}/admin/users/`);
  return res.json();
}

export async function updateAdminUser(userId, data) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteAdminUser(userId) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/`, {
    method: 'DELETE'
  });
  return res.ok;
}

export async function fetchAdminAuditLogs(statusFilter = '', limit = 50, offset = 0) {
  let url = `${API_BASE}/admin/audit-logs/?limit=${limit}&offset=${offset}`;
  if (statusFilter) url += `&status=${statusFilter}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchAdminMetrics() {
  const res = await fetch(`${API_BASE}/admin/metrics/`);
  return res.json();
}

export async function toggleZoneActive(zoneId, isActive) {
  const res = await fetch(`${API_BASE}/zones/${zoneId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active: isActive })
  });
  return res.json();
}
