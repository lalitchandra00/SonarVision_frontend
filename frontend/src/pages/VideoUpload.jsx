import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { FaFilm, FaCloudUploadAlt, FaRocket, FaTimes, FaVideo } from 'react-icons/fa';
import api from '../services/api';
import MissionForm from '../components/MissionForm';
import DetectionOverlay from '../components/DetectionOverlay';
import HazardBadge from '../components/HazardBadge';

const VideoUpload = () => {
  const [step, setStep] = useState(1);
  const [missionId, setMissionId] = useState(null);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(null); // 'uploading' | 'analyzing'
  const [results, setResults] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);

  const onDrop = useCallback((accepted) => {
    setFiles(accepted.slice(0, 3));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4', '.m4v'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
      'video/x-matroska': ['.mkv'],
      'video/webm': ['.webm']
    },
    maxFiles: 3,
    maxSize: 300 * 1024 * 1024
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Select at least one sonar video');
      return;
    }
    setBusy(true);
    setPhase('uploading');
    try {
      const fd = new FormData();
      fd.append('missionId', missionId);
      files.forEach((f) => fd.append('video', f));
      // One video per request to keep multer single-file handling simple
      for (const f of files) {
        const one = new FormData();
        one.append('missionId', missionId);
        one.append('video', f);
        await api.post('/video/upload', one, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success(`${files.length} video${files.length > 1 ? 's' : ''} uploaded`);
      setBusy(false);
      setStep(3);
    } catch (err) {
      setBusy(false);
      toast.error(err.response?.data?.message || 'Video upload failed');
    }
  };

  const handleAnalyze = async () => {
    setBusy(true);
    setPhase('analyzing');
    try {
      const res = await api.post(`/video/${missionId}/start`);
      setTimeout(async () => {
        try {
          const fres = await api.get(`/video/${missionId}`);
          setResults(fres.data.data);
          setBusy(false);
          toast.success('Video analysis complete');
        } catch (e) {
          setBusy(false);
          toast.error('Failed to load video results');
        }
      }, 500);
    } catch (err) {
      setBusy(false);
      toast.error(err.response?.data?.message || 'Video analysis failed');
    }
  };

  const steps = [
    { n: 1, label: 'Mission Details' },
    { n: 2, label: 'Upload Video' },
    { n: 3, label: 'AI Analysis' }
  ];

  const allVideos = results?.videos || [];
  const totalDetections = allVideos.reduce((s, v) => s + (v.totalDetections || 0), 0);
  const totalFrames = allVideos.reduce((s, v) => s + (v.frames?.length || 0), 0);

  if (busy) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="glass rounded-2xl p-10 text-center space-y-5">
          <div className="w-12 h-12 mx-auto border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <div>
            <h3 className="font-semibold">{phase === 'analyzing' ? 'Analyzing Sonar Video' : 'Uploading Sonar Video'}</h3>
            <p className="text-sm text-white/50 mt-1 mono">
              {phase === 'analyzing'
                ? 'Forwarded to SonarVision /predict/video — 1 frame sampled every 3s. This can take a while.'
                : 'Sending video to the backend for storage'}
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
          <FaFilm className="text-cyan-400" /> Sonar Video Analysis
        </h1>
        <p className="text-sm text-white/50 mono mt-1">Upload a sonar survey video — the backend forwards it to /predict/video and stores per-frame results</p>
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
          <h3 className="font-semibold">Upload Sonar Video</h3>
          <div
            {...getRootProps()}
            className={`relative group cursor-pointer rounded-[20px] border-2 border-dashed p-8 text-center transition ${
              isDragActive ? 'border-cyan-400 bg-cyan-500/5' : 'border-white/10 hover:border-cyan-400/50 hover:bg-white/[0.02]'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <FaCloudUploadAlt className="text-2xl text-cyan-400" />
              </div>
              <h4 className="font-semibold">Drop sonar video here</h4>
              <p className="text-sm text-white/50 mt-1">or click to browse</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['MP4', 'MOV', 'AVI', 'MKV', 'WEBM'].map((fmt) => (
                  <span key={fmt} className="text-[10px] mono px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">{fmt}</span>
                ))}
              </div>
              <p className="text-[11px] mono text-white/30 mt-3">Maximum size: 300 MB • Up to 3 videos</p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="grid gap-2">
              <p className="text-xs mono uppercase tracking-widest text-white/40">{files.length} file(s) selected</p>
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl glass border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <FaVideo className="text-cyan-400 text-sm" />
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
            <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl glass border border-white/10 text-sm hover:bg-white/10">Back</button>
            <button onClick={handleUpload} disabled={busy || files.length === 0} className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 flex items-center justify-center gap-2">
              <FaRocket /> Upload & Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass rounded-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center">
            <FaFilm className="text-2xl text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Ready for Video Analysis</h3>
            <p className="text-sm text-white/50 mt-2 max-w-md mx-auto">
              {files.length} sonar video(s) will be sent to the SonarVision API. It samples 1 frame every 3 seconds and returns detections only for frames that contain objects.
            </p>
          </div>
          <button onClick={handleAnalyze} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition flex items-center justify-center gap-2">
            <FaRocket /> Start Video Analysis
          </button>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{allVideos.length}</p>
              <p className="text-[11px] mono uppercase text-white/40">Videos Analyzed</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{totalFrames}</p>
              <p className="text-[11px] mono uppercase text-white/40">Frames w/ Detections</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-cyan-400">{totalDetections}</p>
              <p className="text-[11px] mono uppercase text-white/40">Total Detections</p>
            </div>
          </div>

          {allVideos.map((video) => (
            <div key={video._id} className="glass rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold flex items-center gap-2"><FaVideo className="text-cyan-400" /> {video.originalName}</h4>
                  <p className="text-[11px] mono text-white/40">
                    {video.totalFrames ?? 0} frames sampled • {video.frames?.length || 0} frames with detections
                    {video.elapsedMs ? ` • ${(video.elapsedMs / 1000).toFixed(1)}s API time` : ''} • status: {video.analysisStatus}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-cyan-400">{video.totalDetections}</p>
                  <p className="text-[11px] mono uppercase text-white/40">Detections</p>
                </div>
              </div>

              {video.frames?.length === 0 && (
                <p className="text-sm text-white/50">No objects detected in this video (or processing did not return frames yet).</p>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {(video.frames || []).slice(0, 6).map((frame) => {
                  const frameDetections = frame.detections || [];
                  const frameImages = frame.images?.length > 1 ? frame.images : null;
                  const isSelected = selectedFrame === `${video._id}:${frame.index}`;
                  return frame.url ? (
                    <button
                      key={frame.index}
                      onClick={() => setSelectedFrame(isSelected ? null : `${video._id}:${frame.index}`)}
                      className={`relative rounded-xl overflow-hidden border-2 transition text-left group ${
                        isSelected ? 'border-cyan-400' : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      <img src={frame.url} alt={`frame ${frame.index}`} className="w-full h-40 object-cover opacity-90" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      {frameImages && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 border border-white/20 text-[10px] mono text-cyan-300">
                          {frameImages.length} images
                        </div>
                      )}
                      <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                        <div>
                          <p className="text-xs font-semibold">{frameDetections.length} detection{(frameDetections.length === 1 ? '' : 's')}</p>
                          {frame.timeOffsetSec != null && <p className="text-[10px] mono text-white/50">t+{Number(frame.timeOffsetSec).toFixed(1)}s</p>}
                        </div>
                        <div className="flex gap-1">
                          {frameDetections.slice(0, 3).map((d, i) => (
                            <span key={i} className="text-[9px] mono px-1.5 py-0.5 rounded bg-black/70 border border-white/20">{d.objectType}</span>
                          ))}
                        </div>
                      </div>
                    </button>
                  ) : null;
                })}
              </div>

              {selectedFrame && (() => {
                const [vId, fIdx] = selectedFrame.split(':');
                if (vId !== video._id) return null;
                const frame = (video.frames || []).find((f) => String(f.index) === fIdx);
                if (!frame) return null;
                const frameImages = frame.images?.length > 1 ? frame.images : null;
                return (
                  <div className="space-y-3 border-t border-white/5 pt-4">
                    <DetectionOverlay
                      imageUrl={frame.url}
                      detections={frame.detections || []}
                      imageWidth={video.width || 1024}
                      imageHeight={video.height || 768}
                    />
                    {frameImages && (
                      <div>
                        <p className="text-xs mono uppercase tracking-widest text-white/40 mb-2">All {frameImages.length} frame images</p>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {frameImages.map((u, i) => (
                            <a key={i} href={u} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/40 transition">
                              <img src={u} alt={`frame ${frame.index} img ${i + 1}`} className="w-full h-16 object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-2">
                      {(frame.detections || []).map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
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
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoUpload;