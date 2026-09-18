import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaVideo, FaStop, FaCamera, FaRedo, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';
import DetectionOverlay from '../components/DetectionOverlay';
import HazardBadge from '../components/HazardBadge';

const RealtimePredict = () => {
  const { missionId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sessionRef = useRef(0); // bumped on stop/start to discard stale responses
  const timerRef = useRef(null);
  const inFlightRef = useRef(false); // 1 request at a time – the AI engine can't keep up otherwise
  const seqRef = useRef(0);          // monotonic id for history entries

  const [mission, setMission] = useState(null);
  const [ending, setEnding] = useState(false);
  const [running, setRunning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [captures, setCaptures] = useState(0);
  const [inflight, setInflight] = useState(0);
  const [lastElapsedMs, setLastElapsedMs] = useState(null);
  const [frameDurationSec, setFrameDurationSec] = useState(5);

  useEffect(() => {
    api.get(`/missions/${missionId}`)
      .then((res) => setMission(res.data.data.mission))
      .catch(() => toast.error('Failed to load mission'));
  }, [missionId]);

  const stopCamera = useCallback(() => {
    sessionRef.current += 1;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
    setRunning(false);
    setInflight(0);
  }, []);

  const endSession = async () => {
    try {
      await api.post(`/realtime/${missionId}/end`);
      toast.success('Mission completed & saved to history');
      navigate(`/analysis/${missionId}`);
    } catch (err) {
      toast.error('Failed to complete mission');
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Drone-proxy cadence: the slider (3-10s) sets how often frames are sent,
  // standing in for the sonar drone's real input rate. Interval is rebuilt
  // whenever the camera runs or the duration changes.
  useEffect(() => {
    if (!running) return;
    timerRef.current = setInterval(() => {
      if (inFlightRef.current) return;
      sendFrame();
    }, frameDurationSec * 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [running, frameDurationSec]);

  const startCamera = async () => {
    sessionRef.current += 1;
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setRunning(true);
      setTimeout(() => {
        if (!inFlightRef.current) sendFrame();
      }, 400);
    } catch (err) {
      setCameraError('Camera access denied. Allow camera permission and retry.');
    }
  };

  // Snap a frame from the webcam into its own offscreen canvas and send it.
  // Frames flow continuously, but only one request is in flight at a time:
  // the interval skips ticks while a prediction is pending, so slow inferences
  // never stack up into concurrent requests that time out. The result is then
  // recorded against the mission so it lands in Mission History.
  const sendFrame = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const session = sessionRef.current;
    inFlightRef.current = true;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const t0 = performance.now();
    setCaptures((c) => c + 1);
    setInflight((n) => n + 1);

    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) return;

      const fd = new FormData();
      fd.append('file', blob, `frame_${Date.now()}.jpg`);

      const res = await api.post('/realtime/predict', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (session !== sessionRef.current) return; // stale response from a previous session

      const elapsed = performance.now() - t0;
      const data = res.data.data;
      setCurrent({ ...data, elapsed });
      setLastElapsedMs(elapsed);
      setHistory((h) => [
        {
          id: ++seqRef.current,
          time: new Date().toLocaleTimeString(),
          detections: data.detections || [],
          annotatedImageUrl: data.annotatedImageUrl,
          width: data.width,
          height: data.height,
          elapsed,
        },
        ...h
      ].slice(0, 80));

      // Persist the frame against the mission (best-effort, won't break the stream).
      try {
        await api.post(`/realtime/${missionId}/record`, {
          annotatedImageUrl: data.annotatedImageUrl,
          width: data.width,
          height: data.height,
          elapsedMs: data.elapsedMs ?? elapsed,
          detections: (data.detections || []).map((d) => ({
            objectType: d.objectType,
            confidence: d.confidence,
            class_id: d.class_id ?? d.classId,
            boundingBox: d.bbox || d.boundingBox,
          })),
        });
      } catch (recordErr) {
        console.warn('Failed to record frame:', recordErr.message);
      }
    } catch (err) {
      if (session !== sessionRef.current) return;
      setHistory((h) => [
        {
          id: ++seqRef.current,
          time: new Date().toLocaleTimeString(),
          error: err.response?.data?.message || 'Prediction failed',
          detections: [],
        },
        ...h
      ].slice(0, 80));
    } finally {
      inFlightRef.current = false;
      if (session === sessionRef.current) {
        setInflight((n) => Math.max(0, n - 1));
      }
    }
  };

  const totalDetections = history.reduce((s, h) => s + (h.detections?.length || 0), 0);
  const throughput = lastElapsedMs != null && lastElapsedMs > 0 ? (1000 / lastElapsedMs).toFixed(1) : null;

  const handleStop = async () => {
    stopCamera();
    setEnding(true);
    await endSession();
    setEnding(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3 flex-wrap">
            <FaVideo className="text-cyan-400" /> Realtime Webcam Detection
          </h1>
          <p className="text-sm mono mt-1 font-bold">
            {mission
              ? <>{mission.name} • {mission.locationName}</>
              : 'Proxy for sonar drone realtime input'}
          </p>
        </div>
        <button
          onClick={running ? handleStop : startCamera}
          disabled={ending}
          className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition ${
            running ? 'bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25' : 'bg-white text-black hover:bg-white/90'
          } disabled:opacity-50`}
        >
          {ending ? <><FaCheckCircle /> Saving…</> : running ? <><FaStop /> Stop & Save</> : <><FaCamera /> Start Webcam</>}
        </button>
      </div>

      {cameraError && (
        <div className="glass rounded-xl p-4 border border-red-500/30 text-sm text-red-300">{cameraError}</div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live camera */}
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="relative flex w-2.5 h-2.5">
                {running && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />}
                <span className={`relative inline-flex rounded-full w-2.5 h-2.5 ${running ? 'bg-red-500' : 'bg-white/20'}`} />
              </span>
              Live Feed
            </h3>
            <div className="text-[11px] mono text-white/40">
              <span className="text-cyan-300 font-bold text-xs">{captures} images</span>{inflight > 0 && <span> • {inflight} in flight</span>}
              {throughput && ` • ${throughput} fps`}
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black border border-white/10">
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full aspect-video object-cover"
            />
            {!running && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                <div className="w-14 h-14 rounded-full border-2 border-white/20 border-t-cyan-400 flex items-center justify-center">
                  <FaVideo className="text-white/40" />
                </div>
                <p className="mt-3 text-sm text-white/50">Camera is off</p>
                <button onClick={startCamera} className="mt-4 px-4 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90">
                  Enable Camera
                </button>
              </div>
            )}
            {running && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/70 border border-white/10 text-[10px] mono text-cyan-300">
                REC {inflight > 0 && `• ${inflight} concurrent`}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="frame-duration" className="text-[11px] mono uppercase text-white/50">
                Send Frame Duration
              </label>
              <span className="text-xs mono text-cyan-300">{frameDurationSec}s</span>
            </div>
            <input
              id="frame-duration"
              type="range"
              min={3}
              max={10}
              step={1}
              value={frameDurationSec}
              onChange={(e) => setFrameDurationSec(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <p className="text-[11px] font-bold text-white/40">Proxy for sonar drone input</p>
          </div>
        </div>

        {/* Latest result */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="font-semibold">Latest Prediction</h3>
          {!current && (
            <div className="h-64 flex items-center justify-center text-sm text-white/40">
              No frames analyzed yet — start the camera to begin.
            </div>
          )}
          {current && (
            <div className="space-y-3">
              <DetectionOverlay
                imageUrl={current.annotatedImageUrl}
                detections={current.detections || []}
                imageWidth={current.width || 1024}
                imageHeight={current.height || 768}
              />
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white/5 border border-cyan-500/30">
                  <p className="text-lg font-bold text-cyan-300">{captures}</p>
                  <p className="text-[10px] mono uppercase text-white/40">Images</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-lg font-bold">{current.detections?.length ?? 0}</p>
                  <p className="text-[10px] mono uppercase text-white/40">Objects</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-lg font-bold">{(current.elapsed || current.elapsedMs || 0).toFixed(1)}ms</p>
                  <p className="text-[10px] mono uppercase text-white/40">Latency</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-lg font-bold">{current.confThreshold}</p>
                  <p className="text-[10px] mono uppercase text-white/40">Conf. Thr.</p>
                </div>
              </div>
              {(current.detections || []).length === 0 && (
                <p className="text-sm text-white/50 text-center py-2">No objects detected in this frame.</p>
              )}
              {(current.detections || []).map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
                  <div>
                    <p className="text-sm font-medium">{d.objectType}</p>
                    <p className="text-[11px] mono text-white/50">{(d.confidence * 100).toFixed(1)}% • {d.confidenceLabel}</p>
                  </div>
                  <span className="text-[10px] mono px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-300">class {d.class_id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detection history */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Detection History</h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] mono text-white/40">
            <span>{history.length} frames</span>
            <span className="text-cyan-300">{totalDetections} objects tracked</span>
            <button onClick={() => setHistory([])} className="px-2.5 py-1 rounded-lg border border-white/10 hover:bg-white/10 text-white/60 hover:text-white flex items-center gap-1">
              <FaRedo className="text-[10px]" /> Reset
            </button>
          </div>
        </div>

        {history.length === 0 && <p className="text-sm text-white/50">No frames logged yet.</p>}

        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex-1 min-w-0">
                <p className="text-xs mono text-white/60">{h.time}{h.elapsed != null && ` • ${h.elapsed.toFixed(0)}ms`}</p>
                <p className="text-sm">
                  {h.error ? <span className="text-red-400">{h.error}</span> : (
                    (h.detections || []).length === 0 ? 'No objects detected' : (
                      <span className="flex flex-wrap gap-1.5 mt-1">
                        {(h.detections || []).map((d, i) => (
                          <span key={i} className="inline-flex items-center gap-2 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
                            <span className="text-[10px] mono text-cyan-300">{d.objectType}</span>
                            <span className="text-[10px] mono text-white/40">{(d.confidence * 100).toFixed(0)}%</span>
                          </span>
                        ))}
                      </span>
                    )
                  )}
                </p>
              </div>
              {h.annotatedImageUrl && (
                <a href={h.annotatedImageUrl} target="_blank" rel="noreferrer" className="shrink-0 ml-2">
                  <img src={h.annotatedImageUrl} alt="" className="w-14 h-10 object-cover rounded-lg border border-white/10 hover:border-cyan-400/50 transition" />
                </a>
              )}
              {(h.detections || []).length > 0 && <HazardBadge level="MODERATE" score={null} showScore={false} />}
            </div>
          ))}
        </div>
      </div>

      {mission && (
        <div className="flex justify-center pb-2">
          <button
            onClick={handleStop}
            disabled={ending}
            className="px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 disabled:opacity-50 flex items-center gap-2 transition"
          >
            {ending ? <><FaCheckCircle /> Saving mission…</> : <><FaStop /> Stop & Save to History</>}
          </button>
          <Link to="/missions" className="ml-3 px-6 py-3 rounded-xl glass border border-white/10 text-sm hover:bg-white/10 text-white/60 hover:text-white transition">
            View Mission History
          </Link>
        </div>
      )}
    </div>
  );
};

export default RealtimePredict;