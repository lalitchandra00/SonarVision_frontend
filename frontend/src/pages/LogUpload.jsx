import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { FaFileDownload, FaCloudUploadAlt, FaCog, FaRocket, FaTimes, FaMapMarkedAlt } from 'react-icons/fa';
import api from '../services/api';
import MissionForm from '../components/MissionForm';
import HazardBadge from '../components/HazardBadge';

const LogUpload = () => {
  const [step, setStep] = useState(1);
  const [missionId, setMissionId] = useState(null);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(null);
  const [results, setResults] = useState(null);

  const onDrop = useCallback((accepted) => {
    setFiles(accepted.slice(0, 3));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.xtf', '.jsf', '.sdf']
    },
    maxFiles: 3,
    maxSize: 500 * 1024 * 1024
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Select at least one sonar log file');
      return;
    }
    setBusy(true);
    setPhase('uploading');
    try {
      for (const f of files) {
        const one = new FormData();
        one.append('missionId', missionId);
        one.append('log', f);
        await api.post('/logs/upload', one, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success(`${files.length} log file${files.length > 1 ? 's' : ''} uploaded`);
      setBusy(false);
      setStep(3);
    } catch (err) {
      setBusy(false);
      toast.error(err.response?.data?.message || 'Log upload failed');
    }
  };

  const handleAnalyze = async () => {
    setBusy(true);
    setPhase('analyzing');
    try {
      const res = await api.post(`/logs/${missionId}/start`);
      setTimeout(async () => {
        try {
          const fres = await api.get(`/logs/${missionId}`);
          setResults(fres.data.data);
          setBusy(false);
          toast.success('Log analysis complete');
        } catch (e) {
          setBusy(false);
          toast.error('Failed to load log results');
        }
      }, 500);
    } catch (err) {
      setBusy(false);
      toast.error(err.response?.data?.message || 'Log analysis failed');
    }
  };

  const steps = [
    { n: 1, label: 'Mission Details' },
    { n: 2, label: 'Upload Log' },
    { n: 3, label: 'AI Analysis' }
  ];

  const allLogs = results?.logs || [];
  const totalDetections = allLogs.reduce((s, l) => s + (l.totalDetections || 0), 0);

  if (busy) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="glass rounded-2xl p-10 text-center space-y-5">
          <div className="w-12 h-12 mx-auto border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <div>
            <h3 className="font-semibold">{phase === 'analyzing' ? 'Analyzing Side-Scan Log' : 'Uploading Sonar Log'}</h3>
            <p className="text-sm text-white/50 mt-1 mono">
              {phase === 'analyzing'
                ? 'Forwarded to SonarVision /predict/log — processing may take several minutes.'
                : 'Sending XTF/JSF file to the backend for storage'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
          <FaFileDownload className="text-cyan-400" /> Side-Scan Log Analysis
        </h1>
        <p className="text-sm text-white/50 mono mt-1">Upload a raw sonar log (.xtf / .jsf / .sdf) — the backend forwards it to /predict/log</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-x-3 mb-8">
        {steps.map((s) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${step >= s.n ? 'bg-white text-black' : 'bg-white/10 text-white/40'}`}>
              {s.n}
            </div>
            <span className={`text-sm ${step >= s.n ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
            {s.n < 3 && <div className={`hidden sm:block w-12 h-px mx-2 ${step > s.n ? 'bg-white' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && <MissionForm onCreated={(id) => { setMissionId(id); setStep(2); }} />}

      {step === 2 && (
        <div className="glass rounded-2xl p-6 space-y-6">
          <h3 className="font-semibold">Upload Sonar Log File</h3>
          <div
            {...getRootProps()}
            className={`relative group cursor-pointer rounded-[20px] border-2 border-dashed p-8 text-center transition ${
              isDragActive ? 'border-cyan-400 bg-cyan-500/5' : 'border-white/10 hover:border-cyan-400/50 hover:bg-white/[0.02]'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <FaMapMarkedAlt className="text-2xl text-cyan-400" />
              </div>
              <h4 className="font-semibold">Drop sonar log here</h4>
              <p className="text-sm text-white/50 mt-1">or click to browse</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['XTF', 'JSF', 'SDF'].map((fmt) => (
                  <span key={fmt} className="text-[10px] mono px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">{fmt}</span>
                ))}
              </div>
              <p className="text-[11px] mono text-white/30 mt-3">Maximum size: 500 MB • Up to 3 files</p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="grid gap-2">
              <p className="text-xs mono uppercase tracking-widest text-white/40">{files.length} file(s) selected</p>
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <FaFileDownload className="text-cyan-400 text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{file.name}</p>
                    <p className="text-[11px] mono text-white/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm hover:bg-white/10">Back</button>
            <button onClick={handleUpload} disabled={busy || files.length === 0} className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 flex items-center justify-center gap-2">
              <FaCloudUploadAlt /> Upload & Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass rounded-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center">
            <FaCog className="text-2xl text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Ready for Log Analysis</h3>
            <p className="text-sm text-white/50 mt-2 max-w-md mx-auto">
              {files.length} sonar log file(s) will be sent to the SonarVision API. Processing raw side-scan data can take several minutes.
            </p>
          </div>
          <button onClick={handleAnalyze} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition flex items-center justify-center gap-2">
            <FaRocket /> Start Log Analysis
          </button>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{allLogs.length}</p>
              <p className="text-[11px] mono uppercase text-white/40">Logs Analyzed</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{allLogs.reduce((s, l) => s + (l.strips?.length || 0), 0)}</p>
              <p className="text-[11px] mono uppercase text-white/40">Strips Generated</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-cyan-400">{totalDetections}</p>
              <p className="text-[11px] mono uppercase text-white/40">Total Detections</p>
            </div>
          </div>

          {allLogs.map((log) => (
            <div key={log._id} className="glass rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold flex items-center gap-2"><FaFileDownload className="text-cyan-400" /> {log.originalName}</h4>
                  <p className="text-[11px] mono text-white/40">
                    {log.strips?.length || 0} strips • {log.tiles?.length || 0} tiles
                    {log.elapsedMs ? ` • ${(log.elapsedMs / 1000).toFixed(1)}s API time` : ''} • status: {log.analysisStatus}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-cyan-400">{log.totalDetections}</p>
                  <p className="text-[11px] mono uppercase text-white/40">Detections</p>
                </div>
              </div>

              {log.tiles && log.tiles.length > 0 && (
                <div>
                  <p className="text-xs mono uppercase tracking-widest text-white/40 mb-2">Processed Strips</p>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {(log.tiles || []).slice(0, 12).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/40 transition">
                        <img src={url} alt={`log tile ${i}`} className="w-full h-16 object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {(log.detections || []).length === 0 && (
                <p className="text-sm text-white/50">No detections found in this log file.</p>
              )}

              {(log.detections || []).length > 0 && (
                <div>
                  <p className="text-xs mono uppercase tracking-widest text-white/40 mb-2">Detected Objects</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(log.detections || []).map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
                        <div>
                          <p className="text-sm font-medium">{d.objectType}</p>
                          <p className="text-[11px] mono text-white/50">
                            {(d.confidence * 100).toFixed(1)}% • {d.confidenceLabel}
                            {d.estimatedWidthMeters ? ` • ${d.estimatedWidthMeters}m x ${d.estimatedLengthMeters}m` : ''}
                          </p>
                        </div>
                        <HazardBadge level={d.hazardLevel} score={d.hazardScore} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LogUpload;