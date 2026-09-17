import { NavLink } from 'react-router-dom';
import { FaTimes, FaChartLine, FaUpload, FaMapMarkedAlt, FaHistory, FaExclamationTriangle, FaCog, FaUsers, FaFilm, FaFileDownload, FaVideo } from 'react-icons/fa';
import useAuth from '../hooks/useAuth';

const Sidebar = ({ open = false, onClose = () => {} }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const researcherLinks = [
    { to: '/dashboard', icon: FaChartLine, label: 'Dashboard', desc: 'Analytics Overview' },
    { to: '/upload', icon: FaUpload, label: 'Sonar Image', desc: 'Analyze Sonar Images' },
    { to: '/upload/video', icon: FaFilm, label: 'Sonar Video', desc: 'Analyze Survey Video' },
    { to: '/upload/log', icon: FaFileDownload, label: 'Side-Scan Log', desc: 'Analyze .xtf/.jsf Logs' },
    { to: '/realtime', icon: FaVideo, label: 'Realtime', desc: 'Live Webcam Detection' },
    { to: '/missions', icon: FaHistory, label: 'Mission History', desc: 'All Surveys' },
    { to: '/map', icon: FaMapMarkedAlt, label: 'Marine Map', desc: 'Geospatial View' },
    { to: '/anomalies', icon: FaExclamationTriangle, label: 'Anomalies', desc: 'High-Risk Detections' },
  ];

  const adminLinks = [
    { to: '/admin', icon: FaChartLine, label: 'Admin Dashboard', desc: 'Global Analytics' },
    { to: '/dashboard', icon: FaChartLine, label: 'Research View', desc: 'Switch Role' },
    { to: '/missions', icon: FaHistory, label: 'All Missions', desc: 'Platform Wide' },
    { to: '/map', icon: FaMapMarkedAlt, label: 'Global Map', desc: 'All Anomalies' },
    { to: '/admin/users', icon: FaUsers, label: 'Users', desc: 'Manage Accounts' },
  ];

  const links = isAdmin ? adminLinks : researcherLinks;

  return (
    <aside
      className={`fixed lg:sticky top-[64px] bottom-0 lg:bottom-auto left-0 z-40 w-[280px] shrink-0 glass border-r border-white/5 lg:h-[calc(100vh-64px)] p-4 flex flex-col transition-transform duration-300 transform ${
        open ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:max-h-none`}
    >
      <div className="flex items-center justify-between mb-4 lg:hidden">
        <p className="text-xs mono tracking-widest text-cyan-400/70 uppercase">Navigation</p>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
          aria-label="Close menu"
        >
          <FaTimes />
        </button>
      </div>

      <div className="mb-6 px-3 py-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/10">
        <p className="text-[11px] mono tracking-widest text-cyan-400/70 uppercase">Active Profile</p>
        <p className="font-semibold mt-1 truncate">{user?.name}</p>
        <p className="text-xs text-white/50 truncate">{user?.organization}</p>
        <div className="mt-2 inline-flex px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-[10px] mono text-cyan-400 uppercase">
          {user?.role}
        </div>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-3 rounded-xl transition group ${
                isActive 
                  ? 'bg-white text-black' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <link.icon className="text-[18px] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none truncate">{link.label}</p>
              <p className="text-[11px] opacity-60 mt-1 truncate">{link.desc}</p>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-3 rounded-xl bg-[#0f172a] border border-white/5">
        <p className="text-[11px] mono text-white/40 uppercase tracking-widest">System Status</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/70">AI Engine Operational</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-white/70">Sonar Pipeline Active</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;