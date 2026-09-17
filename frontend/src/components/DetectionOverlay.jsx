import { useState } from 'react';

const DetectionOverlay = ({ imageUrl, detections = [], showBoxes = true, showConfidence = true, showHazard = true, imageWidth = 1024, imageHeight = 768 }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const [natural, setNatural] = useState(null);

  const width = natural?.width || imageWidth;
  const height = natural?.height || imageHeight;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#0f172a] border border-white/10 group">
      {/* Sizing wrapper matches the real image aspect ratio so nothing is cropped */}
      <div
        className="relative w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {/* Sonar image with sonar-like styling */}
        <img
          src={imageUrl || 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800&q=80&auto=format&fit=crop'}
          alt="Sonar"
          onLoad={(e) => {
            const { naturalWidth, naturalHeight } = e.currentTarget;
            if (naturalWidth && naturalHeight && (naturalWidth !== width || naturalHeight !== height)) {
              setNatural({ width: naturalWidth, height: naturalHeight });
            }
          }}
          className="absolute inset-0 w-full h-full object-contain opacity-80"
          style={{ filter: 'grayscale(0.3) contrast(1.2) brightness(0.9) sepia(0.2) hue-rotate(180deg)' }}
        />

        {/* Sonar scanline effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,211,238,0.03) 2px, rgba(34,211,238,0.03) 3px)`
        }} />

        {/* Bounding boxes */}
        {showBoxes && detections.map((det, idx) => {
          const left = (det.boundingBox?.x / width) * 100;
          const top = (det.boundingBox?.y / height) * 100;
          const boxWidth = (det.boundingBox?.width / width) * 100;
          const boxHeight = (det.boundingBox?.height / height) * 100;

          const hazardColor = 
            det.hazardLevel === 'CRITICAL' ? 'border-red-500 bg-red-500/10' :
            det.hazardLevel === 'HIGH' ? 'border-orange-500 bg-orange-500/10' :
            det.hazardLevel === 'MEDIUM' ? 'border-yellow-500 bg-yellow-500/10' :
            'border-emerald-500 bg-emerald-500/10';

          const isHovered = hoveredId === det._id;

          return (
            <div
              key={det._id ?? idx}
              className={`absolute border-2 transition-all cursor-pointer ${hazardColor} ${isHovered ? 'z-20 scale-[1.02] shadow-[0_0_20px_rgba(34,211,238,0.4)]' : 'z-10'}`}
              style={{ left: `${left}%`, top: `${top}%`, width: `${boxWidth}%`, height: `${boxHeight}%` }}
              onMouseEnter={() => setHoveredId(det._id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {(showConfidence || showHazard) && (
                <div className="absolute -top-6 left-0 flex gap-1">
                  <span className="text-[10px] mono px-1.5 py-0.5 rounded bg-black/80 text-white border border-white/20 whitespace-nowrap">
                    {det.objectType}
                  </span>
                  {showConfidence && (
                    <span className="text-[10px] mono px-1.5 py-0.5 rounded bg-cyan-500/90 text-black font-bold">
                      {(det.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                  {showHazard && (
                    <span className={`text-[9px] mono px-1 py-0.5 rounded font-bold ${
                      det.hazardLevel === 'CRITICAL' ? 'bg-red-500 text-white' :
                      det.hazardLevel === 'HIGH' ? 'bg-orange-500 text-white' :
                      'bg-yellow-500 text-black'
                    }`}>
                      {det.hazardLevel}
                    </span>
                  )}
                </div>
              )}

              {/* Corner accents */}
              <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 border-white" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2 border-white" />
              <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-b-2 border-l-2 border-white" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 border-white" />
            </div>
          );
        })}
      </div>

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[11px] mono text-white/60 uppercase tracking-widest">Sonar Feed • Side-Scan</p>
            <p className="text-xs text-white/80 mono">{detections.length} anomalies detected</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] mono text-cyan-400">1024×768 • 600kHz</p>
            <p className="text-[10px] mono text-white/40">Range: 75m • Altitude: 15m</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectionOverlay;