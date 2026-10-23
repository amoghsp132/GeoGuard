import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  Clock, 
  Car, 
  ShieldAlert
} from 'lucide-react';
import { acknowledgeViolation, resolveViolation } from '../api';

export default function AuditTrail({ violations, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = violations.filter(v => {
    const matchesSearch = 
      (v.vehicle_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.zone_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.driver_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    if (violations.length === 0) {
      alert('No records to export.');
      return;
    }

    const headers = ['Incident ID', 'Timestamp', 'Vehicle Number', 'Driver Name', 'Zone Name', 'Zone Category', 'Speed (km/h)', 'Status', 'Security Notes'];
    const rows = filtered.map(v => [
      v.id,
      new Date(v.timestamp).toLocaleString(),
      `"${v.vehicle_number}"`,
      `"${v.driver_name || ''}"`,
      `"${v.zone_name}"`,
      `"${v.zone_type}"`,
      v.speed ? v.speed.toFixed(1) : '0.0',
      v.status,
      `"${(v.security_notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Uber_GeoGuard_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      
      {/* Header */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-white" />
            Security Incident Audit Trail
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Cryptographic timestamped log of all restricted-boundary entries and security responses.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="bg-white hover:bg-neutral-200 text-black text-xs font-bold px-4 py-2.5 rounded-full transition shadow flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by Vehicle Number, Driver, or Zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 text-white text-xs rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:border-white placeholder:text-neutral-600 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-white text-xs rounded-2xl px-4 py-3 focus:outline-none focus:border-white font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Violations</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Uber Table */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-900 text-neutral-400 uppercase tracking-widest font-bold border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-5">ID</th>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Vehicle & Driver</th>
                <th className="py-3.5 px-5">Restricted Zone</th>
                <th className="py-3.5 px-5">Speed</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-neutral-500 font-medium">
                    No violation incidents found.
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-neutral-900/60 transition">
                    <td className="py-4 px-5 font-mono text-neutral-500">#{item.id}</td>
                    <td className="py-4 px-5 whitespace-nowrap text-neutral-300 font-medium">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-white">{item.vehicle_number}</div>
                      <div className="text-[11px] text-neutral-400">{item.driver_name}</div>
                    </td>
                    <td className="py-4 px-5 font-semibold text-white">{item.zone_name}</td>
                    <td className="py-4 px-5 font-mono">{item.speed?.toFixed(1)} km/h</td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.status === 'ACTIVE' ? 'bg-red-600 text-white' :
                        item.status === 'ACKNOWLEDGED' ? 'bg-amber-400 text-black' :
                        'bg-neutral-800 text-emerald-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      {item.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleAcknowledge(item.id)}
                          className="bg-amber-400 hover:bg-amber-300 text-black px-3 py-1 rounded-full text-[11px] font-bold mr-2"
                        >
                          Acknowledge
                        </button>
                      )}
                      {item.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleResolve(item.id)}
                          className="bg-white hover:bg-neutral-200 text-black px-3 py-1 rounded-full text-[11px] font-bold"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
