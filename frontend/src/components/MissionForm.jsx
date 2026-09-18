import { useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

const MissionForm = ({ onCreated, sourceType = 'sonar', submitLabel = 'Create Mission & Continue' }) => {
  const [form, setForm] = useState({
    name: '',
    locationName: '',
    latitude: '',
    longitude: '',
    depth: '',
    date: new Date().toISOString().split('T')[0],
    vehicleType: 'AUV'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/missions', {
        ...form,
        sourceType,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        depth: parseFloat(form.depth)
      });
      toast.success('Mission created');
      onCreated(res.data.data.mission._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create mission');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-5">
      <h3 className="font-semibold flex items-center gap-2">
        <FaMapMarkerAlt className="text-cyan-400" /> Mission Metadata
      </h3>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Mission Name *</label>
          <input
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Mission Alpha - Arabian Sea Deep Survey"
            className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
          />
        </div>

        <div>
          <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Location Name *</label>
          <input
            required
            value={form.locationName}
            onChange={e => setForm({ ...form, locationName: e.target.value })}
            placeholder="Arabian Sea - Coral Zone"
            className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
          />
        </div>

        <div>
          <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Vehicle Type *</label>
          <select
            value={form.vehicleType}
            onChange={e => setForm({ ...form, vehicleType: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
          >
            <option>Ship</option>
            <option>AUV</option>
            <option>ROV</option>
          </select>
        </div>

        <div>
          <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Latitude *</label>
          <input
            required
            type="number"
            step="any"
            value={form.latitude}
            onChange={e => setForm({ ...form, latitude: e.target.value })}
            placeholder="15.2993"
            className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
          />
        </div>

        <div>
          <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Longitude *</label>
          <input
            required
            type="number"
            step="any"
            value={form.longitude}
            onChange={e => setForm({ ...form, longitude: e.target.value })}
            placeholder="74.1240"
            className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
          />
        </div>

        <div>
          <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Depth (m) *</label>
          <input
            required
            type="number"
            step="any"
            value={form.depth}
            onChange={e => setForm({ ...form, depth: e.target.value })}
            placeholder="45"
            className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
          />
        </div>

        <div>
          <label className="text-xs mono uppercase tracking-widest text-white/40 mb-2 block">Survey Date *</label>
          <input
            required
            type="date"
            value={form.date}
            onChange={e => setForm({ ...form, date: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-[#020617] border border-white/10 focus:border-cyan-400/50 focus:outline-none text-sm"
          />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition disabled:opacity-50">
        {submitting ? 'Creating Mission…' : submitLabel}
      </button>
    </form>
  );
};

export default MissionForm;