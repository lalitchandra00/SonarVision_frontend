import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaDownload, FaMapMarkedAlt, FaFilter } from 'react-icons/fa';
import api from '../services/api';
import DetectionOverlay from '../components/DetectionOverlay';
import DetectionCard from '../components/DetectionCard';
import HazardBadge from '../components/HazardBadge';
import { toast } from 'react-toastify';

const AnalysisResults = () => {
  const { missionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [filters, setFilters] = useState({ showBoxes: true, showConfidence: true, showHazard: true });

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get(`/analysis/${missionId}`);
        setData(res.data.data);
      } catch (e) {
        toast.error('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [missionId]);

  const handleDownload = async (type) => {
    try {
      const res = await api.get(`/reports/${missionId}/${type}`, {
        responseType: type === 'csv' ? 'blob' : 'json'
      });
      
      if (type === 'csv') {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${data?.mission.name.replace(/\s+/g, '_')}_report.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${data?.mission.name.replace(/\s+/g, '_')}_report.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      toast.success(`${type.toUpperCase()} report downloaded`);
    } catch (e) {
      toast.error('Download failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-white/50">No data found</div>;

  const currentImage = data.images[selectedImage];
  const imageDetections = data.detections.filter(d => 
    !currentImage || d.sonarImage?._id === currentImage._id || d.sonarImage === currentImage._id
  );

  const detectionsToShow = currentImage ? imageDetections : data.detections.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 items-start">
        <div>
          <h1 className="text-2xl font-bold">{data.mission.name}</h1>
          <p className="text-sm text-white/50 mono">{data.mission.locationName} • {data.images.length} images • {data.detections.length} anomalies</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleDownload('json')} className="px-4 py-2 rounded-xl glass border border-white/10 text-sm flex items-center gap-2 hover:bg-white/10">
            <FaDownload /> JSON
          </button>
          <button onClick={() => handleDownload('csv')} className="px-4 py-2 rounded-xl bg-white text-black text-sm flex items-center gap-2 hover:bg-white/90">
            <FaDownload /> CSV
          </button>
          <Link to={`/map?mission=${missionId}`} className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-sm flex items-center gap-2 hover:bg-cyan-400">
            <FaMapMarkedAlt /> View on Map
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{data.stats.total}</p>
          <p className="text-[11px] mono uppercase text-white/40">Total Detections</p>
        </div>
        <div className="glass rounded-xl p-4 text-center border-red-500/20">
          <p className="text-2xl font-bold text-red-400">{data.stats.critical}</p>
          <p className="text-[11px] mono uppercase text-white/40">Critical</p>
        </div>
        <div className="glass rounded-xl p-4 text-center border-orange-500/20">
          <p className="text-2xl font-bold text-orange-400">{data.stats.high}</p>
          <p className="text-[11px] mono uppercase text-white/40">High</p>
        </div>
        <div className="glass rounded-xl p-4 text-center border-yellow-500/20">
          <p className="text-2xl font-bold text-yellow-400">{data.stats.medium + data.stats.low}</p>
          <p className="text-[11px] mono uppercase text-white/40">Medium/Low</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">Sonar Visualization</h3>
            <div className="flex flex-wrap gap-2 text-[11px] mono">
              {[
                { key: 'showBoxes', label: 'Boxes' },
                { key: 'showConfidence', label: 'Confidence' },
                { key: 'showHazard', label: 'Hazard' }
              ].map(f => (
                <label key={f.key} className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-full glass border border-white/10">
                  <input
                    type="checkbox"
                    checked={filters[f.key]}
                    onChange={e => setFilters({ ...filters, [f.key]: e.target.checked })}
                    className="w-3 h-3"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <DetectionOverlay
            imageUrl={currentImage?.annotatedImageUrl || currentImage?.imageUrl}
            detections={detectionsToShow}
            showBoxes={filters.showBoxes}
            showConfidence={filters.showConfidence}
            showHazard={filters.showHazard}
            imageWidth={currentImage?.width || data.images[0]?.width || 1024}
            imageHeight={currentImage?.height || data.images[0]?.height || 768}
          />

          {data.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {data.images.map((img, idx) => (
                <button
                  key={img._id}
                  onClick={() => setSelectedImage(idx)}
                  className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${selectedImage === idx ? 'border-cyan-400' : 'border-white/10 hover:border-white/20'}`}
                >
                  <img src={img.imageUrl} alt={img.originalName} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Detections • {detectionsToShow.length}</h3>
            <FaFilter className="text-white/30" />
          </div>
          
          <div className="space-y-3 max-h-[700px] overflow-y-auto custom-scrollbar pr-1">
            {detectionsToShow.map(det => (
              <DetectionCard key={det._id} detection={det} />
            ))}
            {detectionsToShow.length === 0 && (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-sm text-white/50">No detections in this image</p>
                <p className="text-xs text-white/30 mono mt-1">Try another frame or adjust filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
