import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaEye, FaTrash } from 'react-icons/fa';
import api from '../services/api';
import { formatDate } from '../utils/formatters';
import { toast } from 'react-toastify';

const MissionHistory = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchMissions = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus) params.append('status', filterStatus);
      
      const res = await api.get(`/missions?${params.toString()}`);
      setMissions(res.data.data.missions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [search, filterStatus]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this mission? This will remove all associated images and detections.')) return;
    try {
      await api.delete(`/missions/${id}`);
      toast.success('Mission deleted');
      fetchMissions();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mission History</h1>
          <p className="text-sm text-white/50 mono mt-1">All sonar surveys and analysis results</p>
        </div>
        <Link to="/upload" className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90">
          New Mission
        </Link>
      </div>

      <div className="glass rounded-2xl p-4 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search missions, locations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#020617] border border-white/10 text-sm focus:border-cyan-400/50 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="uploaded">Uploaded</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] mono uppercase tracking-widest text-white/30 border-b border-white/5 bg-white/[0.02]">
                <th className="text-left py-4 px-5 font-normal">Mission</th>
                <th className="text-left py-4 px-3 font-normal">Date</th>
                <th className="text-left py-4 px-3 font-normal">Location</th>
                <th className="text-left py-4 px-3 font-normal">Surface</th>
                <th className="text-left py-4 px-3 font-normal">Detections</th>
                <th className="text-left py-4 px-3 font-normal">Critical</th>
                <th className="text-left py-4 px-3 font-normal">Status</th>
                <th className="text-left py-4 px-5 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : missions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-white/40">
                    No missions found. <Link to="/upload" className="text-cyan-400">Create your first mission</Link>
                  </td>
                </tr>
              ) : (
                missions.map(m => (
                  <tr key={m._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                    <td className="py-4 px-5">
                      <p className="font-medium truncate max-w-[280px]">{m.name}</p>
                      <p className="text-xs text-white/40 mono">{m.vehicleType} • {m.depth}m depth</p>
                      {m.sourceType === 'realtime' && (
                        <span className="mt-1 inline-flex px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[10px] mono uppercase border border-cyan-500/20">
                          ⚡ Live Stream
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3 mono text-white/60 text-xs">{formatDate(m.date)}</td>
                    <td className="py-4 px-3">
                      <p className="truncate max-w-[140px]">{m.locationName}</p>
                      <p className="text-[11px] mono text-white/40">{m.latitude.toFixed(2)}, {m.longitude.toFixed(2)}</p>
                    </td>
                    <td className="py-4 px-3 mono">
                      {m.sourceType === 'realtime' ? `${m.realtimeFrames || 0} frames` : `${m.totalImages} images`}
                    </td>
                    <td className="py-4 px-3 mono">{m.totalDetections}</td>
                    <td className="py-4 px-3">
                      {m.criticalCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs mono border border-red-500/20">
                          {m.criticalCount}
                        </span>
                      ) : (
                        <span className="text-white/30 mono text-xs">0</span>
                      )}
                    </td>
                    <td className="py-4 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] mono uppercase border ${
                        m.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                        m.status === 'processing' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20' :
                        m.status === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                        'bg-white/5 text-white/50 border-white/10'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex gap-1.5">
                        <Link to={`/analysis/${m._id}`} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition">
                          <FaEye className="text-xs" />
                        </Link>
                        <button onClick={() => handleDelete(m._id)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition">
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
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
};

export default MissionHistory;
