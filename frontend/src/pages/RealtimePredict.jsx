import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaVideo, FaStop, FaCamera, FaRedo } from 'react-icons/fa';
import api from '../services/api';
import DetectionOverlay from '../components/DetectionOverlay';
import HazardBadge from '../components/HazardBadge';

const FRAME_INTERVAL_MS = 1500;

const RealtimePredict = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sessionRef = useRef(0); // bumped on stop/start to discard stale responses
  const timerRef = useRef(null);
  const inFlightRef = useRef(false); // 1 request at a time – the AI engine can't keep up otherwise
  const seqRef = useRef(0);          // monotonic id for history entries

  const [running, setRunning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [captures, setCaptures] = useState(0);
  const [inflight, setInflight] = useState(0);
  const [lastElapsedMs, setLastElapsedMs] = useState(null);

  const stopCamera = useCallback(() => {
    sessionRef.current += 1;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks()?.forEach((t) => t.stop());
    streamRef.current = null;
    setRunning(false);
    setInflight(0);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

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

      timerRef.current = setInterval(() => {
        // Only one request in flight at a time: the free detection engine
        // processes ~1 frame at a time, so overlapping requests pile up and
        // time out. Skip a tick instead of stacking another request.
        if (inFlightRef.current) return;
        sendFrame();
      }, FRAME_INTERVAL_MS);
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
  // never stack up into concurrent requests that time out.
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3 flex-wrap">
            <FaVideo className="text-cyan-400" /> Realtime Webcam Detection
          </h1>
          <p className="text-sm text-white/50 mono mt-1">
            Sends frames continuously — but only 1 request in flight at a time, so slow inferences never stack up
          </p>
        </div>
        <button
          onClick={running ? stopCamera : startCamera}
          className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition ${
            running ? 'bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25' : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          {running ? <><FaStop /> Stop Stream</> : <><FaCamera /> Start Webcam</>}
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
              {captures} sent{inflight > 0 && <span className="text-cyan-300"> • {inflight} in flight</span>}
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

          {running && (
            <div className="flex gap-3">
              <button onClick={sendFrame} className="flex-1 py-2.5 rounded-xl border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/10 transition">
                Send Frame Now
              </button>
            </div>
          )}
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
              <div className="grid grid-cols-3 gap-2 text-center">
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
    </div>
  );
};

export default RealtimePredict;