import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  AlertTriangle,
  Lock,
  Trash2,
  RefreshCw,
  Download,
  MapPin,
  Car,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { fetchZones, fetchVehicles, deleteZone } from '../api';

const API_BASE = 'http://localhost:8000/api';

// ── Shared loading spinner ──────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
    </div>
  );
}

// ── Role badge ──────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const cls =
    role === 'ADMIN'
      ? 'bg-white text-black'
      : role === 'SECURITY'
      ? 'bg-emerald-900 text-emerald-300 border border-emerald-700'
      : 'bg-amber-900 text-amber-300 border border-amber-700';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {role}
    </span>
  );
}

// ── Users Sub-Tab ────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/users/`);
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await fetch(`${API_BASE}/admin/users/${userId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      loadUsers();
    } catch (err) {
      alert('Failed to update role: ' + err.message);
    }
  };

  const handleToggleActive = async (userId, current) => {
    try {
      await fetch(`${API_BASE}/admin/users/${userId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      });
      loadUsers();
    } catch (err) {
      alert('Failed to toggle status: ' + err.message);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await fetch(`${API_BASE}/admin/users/${userId}/`, { method: 'DELETE' });
      loadUsers();
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary badge */}
      <div className="flex items-center justify-between">
        {!loading && !error && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            {users.length} users registered
          </span>
        )}
        <button
          onClick={loadUsers}
          className="ml-auto flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {loading && <Spinner />}
      {error && (
        <div className="p-4 rounded-2xl bg-neutral-900 border border-red-800 text-red-400 text-xs">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-neutral-950 text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="bg-neutral-900 border-b border-neutral-800/60 hover:bg-neutral-800/30 transition"
                >
                  <td className="px-4 py-3 text-white font-medium">{u.full_name || '—'}</td>
                  <td className="px-4 py-3 text-neutral-300 font-mono">{u.username}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-neutral-400 font-mono">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 font-bold ${u.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Role dropdown */}
                      <div className="relative">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="appearance-none bg-neutral-800 border border-neutral-700 text-white text-[10px] font-bold rounded-lg px-2 py-1 pr-5 focus:outline-none focus:border-neutral-500 cursor-pointer"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="SECURITY">SECURITY</option>
                          <option value="DRIVER">DRIVER</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggleActive(u.id, u.is_active)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                          u.is_active
                            ? 'border-red-800 text-red-400 hover:bg-red-950'
                            : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        className="p-1 text-red-500 hover:text-red-300 hover:bg-red-950 rounded-lg transition"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-500 text-xs bg-neutral-900">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Audit Logs Sub-Tab ───────────────────────────────────────────────────────
function AuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  const loadLogs = async (newOffset = 0, newFilter = filter) => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_BASE}/admin/audit-logs/?limit=${LIMIT}&offset=${newOffset}`;
      if (newFilter) url += `&status=${newFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      const results = Array.isArray(data) ? data : data.results || [];
      if (newOffset === 0) {
        setLogs(results);
      } else {
        setLogs((prev) => [...prev, ...results]);
      }
      setOffset(newOffset + LIMIT);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    loadLogs(0, filter);
  }, [filter]);

  const handleExportCSV = () => {
    const headers = ['Username', 'IP Address', 'Platform', 'Status', 'Timestamp'];
    const rows = logs.map((l) => [
      l.username || '',
      l.ip_address || '',
      l.platform || '',
      l.status || '',
      l.timestamp || l.created_at || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterOptions = [
    { value: '', label: 'All' },
    { value: 'SUCCESS', label: 'Success' },
    { value: 'FAILED', label: 'Failed' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter row + Export */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                filter === opt.value
                  ? 'bg-white text-black'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full transition"
        >
          <Download className="w-3 h-3" />
          Export CSV
        </button>
      </div>

      {loading && logs.length === 0 && <Spinner />}
      {error && (
        <div className="p-4 rounded-2xl bg-neutral-900 border border-red-800 text-red-400 text-xs">
          {error}
        </div>
      )}

      {!error && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-neutral-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-neutral-950 text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="px-4 py-3 text-left">Username</th>
                  <th className="px-4 py-3 text-left">IP Address</th>
                  <th className="px-4 py-3 text-left">Platform</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, idx) => (
                  <tr
                    key={idx}
                    className="bg-neutral-900 border-b border-neutral-800/60 hover:bg-neutral-800/30 transition"
                  >
                    <td className="px-4 py-3 text-white font-mono">{l.username || '—'}</td>
                    <td className="px-4 py-3 text-neutral-400 font-mono">{l.ip_address || '—'}</td>
                    <td className="px-4 py-3 text-neutral-400">{l.platform || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          l.status === 'SUCCESS'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-400 font-mono text-[10px]">
                      {l.timestamp || l.created_at || '—'}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-neutral-500 text-xs bg-neutral-900">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          <button
            onClick={() => loadLogs(offset)}
            disabled={loading}
            className="w-full py-3 text-xs font-bold text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-2xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Load More
          </button>
        </>
      )}
    </div>
  );
}

// ── Metrics Sub-Tab ──────────────────────────────────────────────────────────
function MetricsTab() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/metrics/`);
      if (!res.ok) throw new Error('Failed to load metrics');
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMetrics(); }, []);

  const metricCards = metrics
    ? [
        {
          label: 'Total Users',
          value: metrics.total_users ?? '—',
          icon: Users,
          color: 'text-blue-400',
          bg: 'bg-blue-950 border-blue-800',
        },
        {
          label: 'Active Users',
          value: metrics.active_users ?? '—',
          icon: UserCheck,
          color: 'text-emerald-400',
          bg: 'bg-emerald-950 border-emerald-800',
        },
        {
          label: 'Failed Logins Today',
          value: metrics.failed_logins_today ?? '—',
          icon: AlertTriangle,
          color: 'text-red-400',
          bg: 'bg-red-950 border-red-800',
        },
        {
          label: 'Active Lockouts',
          value: metrics.active_lockouts ?? '—',
          icon: Lock,
          color: 'text-orange-400',
          bg: 'bg-orange-950 border-orange-800',
        },
      ]
    : [];

  const totalLogins =
    (metrics?.logins_today?.success ?? 0) + (metrics?.logins_today?.failed ?? 0) || 1;

  return (
    <div className="space-y-6">
      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={loadMetrics}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {loading && <Spinner />}
      {error && (
        <div className="p-4 rounded-2xl bg-neutral-900 border border-red-800 text-red-400 text-xs">
          {error}
        </div>
      )}

      {!loading && !error && metrics && (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {metricCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2`}
                >
                  <div className={`inline-flex p-2 rounded-xl border ${card.bg}`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-black text-white">{card.value}</p>
                  <p className="text-xs text-neutral-400 font-medium">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* Role Breakdown */}
          <div>
            <h3 className="text-white font-black text-lg tracking-tight mb-3">Role Breakdown</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Admin', value: metrics.role_breakdown?.ADMIN ?? 0, color: 'text-white' },
                { label: 'Security', value: metrics.role_breakdown?.SECURITY ?? 0, color: 'text-emerald-400' },
                { label: 'Driver', value: metrics.role_breakdown?.DRIVER ?? 0, color: 'text-amber-400' },
              ].map((r) => (
                <div key={r.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                  <p className={`text-2xl font-black ${r.color}`}>{r.value}</p>
                  <p className="text-xs text-neutral-400 mt-1">{r.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Login Stats Today */}
          <div>
            <h3 className="text-white font-black text-lg tracking-tight mb-3">Login Stats Today</h3>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              {/* Success bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-400 font-bold">Successful Logins</span>
                  <span className="text-emerald-400 font-bold">{metrics.logins_today?.success ?? 0}</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${((metrics.logins_today?.success ?? 0) / totalLogins) * 100}%` }}
                  />
                </div>
              </div>
              {/* Failed bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-neutral-400 font-bold">Failed Logins</span>
                  <span className="text-red-400 font-bold">{metrics.logins_today?.failed ?? 0}</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full transition-all"
                    style={{ width: `${((metrics.logins_today?.failed ?? 0) / totalLogins) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Zone Admin Sub-Tab ───────────────────────────────────────────────────────
function ZoneAdminTab() {
  const [zones, setZones] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [z, v] = await Promise.all([
        fetchZones().catch(() => []),
        fetchVehicles().catch(() => []),
      ]);
      setZones(Array.isArray(z) ? z : []);
      setVehicles(Array.isArray(v) ? v : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleToggleZoneActive = async (zoneId, isActive) => {
    try {
      await fetch(`${API_BASE}/zones/${zoneId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });
      loadData();
    } catch (err) {
      alert('Failed to toggle zone: ' + err.message);
    }
  };

  const handleDeleteZone = async (zoneId, zoneName) => {
    if (!window.confirm(`Delete zone "${zoneName}"?`)) return;
    try {
      await deleteZone(zoneId);
      loadData();
    } catch (err) {
      alert('Failed to delete zone: ' + err.message);
    }
  };

  const severityColor = (s) => {
    if (s === 'HIGH' || s === 'CRITICAL') return 'text-red-400';
    if (s === 'MEDIUM') return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {loading && <Spinner />}
      {error && (
        <div className="p-4 rounded-2xl bg-neutral-900 border border-red-800 text-red-400 text-xs">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Zones Table */}
          <div>
            <h3 className="text-white font-black text-lg tracking-tight mb-3">
              <MapPin className="inline w-4 h-4 mr-1 text-neutral-400" />
              Zones ({zones.length})
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-neutral-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-neutral-950 text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Severity</th>
                    <th className="px-4 py-3 text-left">Active</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr key={z.id} className="bg-neutral-900 border-b border-neutral-800/60 hover:bg-neutral-800/30 transition">
                      <td className="px-4 py-3 text-white font-medium">{z.name}</td>
                      <td className="px-4 py-3 text-neutral-400">{z.zone_type || z.type || '—'}</td>
                      <td className={`px-4 py-3 font-bold ${severityColor(z.severity)}`}>{z.severity || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 font-bold ${z.is_active ? 'text-emerald-400' : 'text-neutral-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${z.is_active ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                          {z.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleZoneActive(z.id, z.is_active)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                              z.is_active
                                ? 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                                : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950'
                            }`}
                          >
                            {z.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteZone(z.id, z.name)}
                            className="p-1 text-red-500 hover:text-red-300 hover:bg-red-950 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {zones.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-neutral-500 bg-neutral-900">
                        No zones found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vehicles Table */}
          <div>
            <h3 className="text-white font-black text-lg tracking-tight mb-3">
              <Car className="inline w-4 h-4 mr-1 text-neutral-400" />
              Vehicles ({vehicles.length})
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-neutral-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-neutral-950 text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3 text-left">Vehicle No.</th>
                    <th className="px-4 py-3 text-left">Driver</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Last Ping</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id} className="bg-neutral-900 border-b border-neutral-800/60 hover:bg-neutral-800/30 transition">
                      <td className="px-4 py-3 text-amber-300 font-mono font-bold">{v.vehicle_number}</td>
                      <td className="px-4 py-3 text-white">{v.driver_name || '—'}</td>
                      <td className="px-4 py-3 text-neutral-400">{v.vehicle_type || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${
                          v.current_status === 'VIOLATION_INSIDE'
                            ? 'text-red-400'
                            : v.current_status === 'APPROACHING_WARNING'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}>
                          {v.current_status || 'NORMAL'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-400 font-mono text-[10px]">
                        {v.last_ping_time || '—'}
                      </td>
                    </tr>
                  ))}
                  {vehicles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-neutral-500 bg-neutral-900">
                        No vehicles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main AdminPanel Component ────────────────────────────────────────────────
const SUBTABS = [
  { id: 'users', label: '👥 Users' },
  { id: 'audit', label: '📋 Audit Logs' },
  { id: 'metrics', label: '📊 Metrics' },
  { id: 'zones', label: '🗺️ Zone Admin' },
];

export default function AdminPanel({ currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState('users');

  return (
    <div className="space-y-5">
      {/* Panel heading */}
      <div>
        <h2 className="text-white font-black text-2xl tracking-tight">Admin Panel</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Logged in as <span className="text-white font-bold">{currentUser?.full_name || currentUser?.username}</span>
        </p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {SUBTABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition ${
              activeSubTab === tab.id
                ? 'bg-white text-black'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div>
        {activeSubTab === 'users' && <UsersTab />}
        {activeSubTab === 'audit' && <AuditLogsTab />}
        {activeSubTab === 'metrics' && <MetricsTab />}
        {activeSubTab === 'zones' && <ZoneAdminTab />}
      </div>
    </div>
  );
}
