import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaRocket, FaMapMarkerAlt } from 'react-icons/fa';
import api from '../services/api';
import SonarUploader from '../components/SonarUploader';
import LoadingPipeline from '../components/LoadingPipeline';

const UploadMission = () => {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    name: '',
    locationName: '',
    latitude: '',
    longitude: '',
    depth: '',
    date: new Date().toISOString().split('T')[0],
    vehicleType: 'AUV'
  });
  const [missionId, setMissionId] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pipelineStage, setPipelineStage] = useState(0);
  const navigate = useNavigate();

  const pipelineStages = [
    { id: 1, name: 'Uploading Sonar Data', status: 'pending' },
    { id: 2, name: 'Validating Files', status: 'pending' },
    { id: 3, name: 'Preprocessing Acoustic Image', status: 'pending' },
    { id: 4, name: 'Reducing Speckle Noise', status: 'pending' },
    { id: 5, name: 'Enhancing Contrast', status: 'pending' },
    { id: 6, name: 'Running AI Detection', status: 'pending' },
    { id: 7, name: 'Filtering False Positives', status: 'pending' },
    { id: 8, name: 'Parsing Metadata', status: 'pending' },
    { id: 9, name: 'Geotagging Anomalies', status: 'pending' },
    { id: 10, name: 'Generating Report', status: 'pending' },
  ];

  const handleCreateMission = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/missions', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        depth: parseFloat(form.depth)
      });
      setMissionId(res.data.data.mission._id);
      toast.success('Mission created');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create mission');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Select at least one sonar image');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('missionId', missionId);
      files.forEach(f => fd.append('sonarImages', f));
      
      await api.post('/upload/sonar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
          setUploadProgress(pct);
        }
      });
      toast.success(`${files.length} images uploaded`);
      setUploadProgress(100);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setPipelineStage(0);
    
    // Animate pipeline
    const interval = setInterval(() => {
      setPipelineStage(prev => {
        if (prev >= 9) {
          clearInterval(interval);
          return 9;
        }
        return prev + 1;
      });
    }, 800);

    try {
      // Small delay for UX
      await new Promise(r => setTimeout(r, 1000));
      const res = await api.post(`/analysis/${missionId}/start`);
      clearInterval(interval);
      setPipelineStage(10);
      toast.success(`Analysis complete! Found ${res.data.data.summary.totalAnomalies} anomalies`);
      setTimeout(() => {
        navigate(`/analysis/${missionId}`);
      }, 1500);
    } catch (err) {
      clearInterval(interval);
      setAnalyzing(false);
      toast.error(err.response?.data?.message || 'Analysis failed');
    }
  };

  if (analyzing) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingPipeline stages={pipelineStages} currentStage={pipelineStage} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analyze Sonar Mission</h1>
        <p className="text-sm text-white/50 mono mt-1">Upload Side-Scan Sonar imagery and run AI detection</p>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: 'Mission Details' },
          { n: 2, label: 'Upload Sonar' },
          { n: 3, label: 'AI Analysis' }
        ].map(s => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
              step >= s.n ? 'bg-white text-black' : 'bg-white/10 text-white/40'
            }`}>
              {s.n}
            </div>
            <span className={`text-sm ${step >= s.n ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
            {s.n < 3 && <div className={`w-12 h-px mx-2 ${step > s.n ? 'bg-white' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={handleCreateMission} className="glass rounded-2xl p-6 space-y-5">
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

          <button type="submit" className="w-full py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition">
            Create Mission & Continue
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="glass rounded-2xl p-6 space-y-6">
          <h3 className="font-semibold">Upload Sonar Imagery</h3>
          <SonarUploader files={files} setFiles={setFiles} />
          {uploading && (
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin shrink-0" />
                <div>
                  <p className="text-sm font-medium text-cyan-300">Uploading {files.length} image{files.length > 1 ? 's' : ''}…</p>
                  <p className="text-[11px] mono text-white/50">Buffering sonar data to secure storage</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] mono text-white/40 text-right">{uploadProgress}%</p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} disabled={uploading} className="px-5 py-2.5 rounded-xl glass border border-white/10 text-sm hover:bg-white/10 disabled:opacity-50">
              Back
            </button>
            <button onClick={handleUpload} disabled={uploading} className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Uploading…
                </>
              ) : (
                <><FaRocket /> Upload & Continue</>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass rounded-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center">
            <FaRocket className="text-2xl text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Ready for AI Analysis</h3>
            <p className="text-sm text-white/50 mt-2 max-w-md mx-auto">
              {files.length} sonar images will be processed through our YOLO-based detection pipeline with noise filtering, confidence scoring, and hazard assessment.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center py-4 border-y border-white/5">
            <div>
              <p className="text-2xl font-bold">{files.length}</p>
              <p className="text-[11px] mono uppercase text-white/40">Images</p>
            </div>
            <div>
              <p className="text-2xl font-bold">10</p>
              <p className="text-[11px] mono uppercase text-white/40">Pipeline Stages</p>
            </div>
            <div>
              <p className="text-2xl font-bold">~30s</p>
              <p className="text-[11px] mono uppercase text-white/40">Est. Time</p>
            </div>
          </div>

          <button onClick={handleAnalyze} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition flex items-center justify-center gap-2">
            <FaRocket /> Start AI Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadMission;
