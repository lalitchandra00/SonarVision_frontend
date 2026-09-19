import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaWater, FaBrain, FaMapMarkedAlt, FaExclamationTriangle, FaChartLine, FaShieldAlt, FaSatelliteDish, FaFileDownload } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';

const Home = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen ocean-gradient">
      <Navbar />
      
      {/* Hero */}
      <section className="pt-24 lg:pt-[120px] pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs mono tracking-widest uppercase mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              AI-Powered Marine Intelligence Platform
            </div>
            
            <h1 className="text-[36px] sm:text-[48px] lg:text-[64px] font-bold leading-[0.9] tracking-tight">
              AI-Powered Intelligence for a{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Cleaner Ocean
              </span>
            </h1>
            
            <p className="text-[18px] text-white/60 leading-relaxed mt-6 max-w-[560px]">
              OceanSentinel AI analyzes Side-Scan Sonar imagery to automatically detect marine debris, ghost nets, underwater hazards, and artificial anomalies.
            </p>
            
            <div className="flex flex-wrap gap-4 mt-8">
              {isAuthenticated ? (
                <>
                  <Link to="/upload" className="px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition">
                    Start Analysis
                  </Link>
                  <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className="px-6 py-3 rounded-xl glass hover:bg-white/10 font-medium transition">
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition">
                    Start Analysis
                  </Link>
                  <Link to="/login" className="px-6 py-3 rounded-xl glass hover:bg-white/10 font-medium transition">
                    Explore Platform
                  </Link>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/5">
              <div>
                <p className="text-3xl font-bold">5,000+</p>
                <p className="text-xs mono text-white/40 uppercase tracking-widest mt-1">Sonar Images Analyzed</p>
              </div>
              <div>
                <p className="text-3xl font-bold">1,200+</p>
                <p className="text-xs mono text-white/40 uppercase tracking-widest mt-1">Marine Hazards Detected</p>
              </div>
              <div>
                <p className="text-3xl font-bold">94%</p>
                <p className="text-xs mono text-white/40 uppercase tracking-widest mt-1">Avg Detection Confidence</p>
              </div>
            </div>
          </motion.div>

          {/* Animated sonar visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative w-full aspect-square max-w-[520px] mx-auto">
              <div className="absolute inset-0 rounded-[32px] glass-strong p-6">
                {/* Radar/sonar circles */}
                <div className="relative w-full h-full rounded-[20px] bg-[#020617] overflow-hidden border border-white/5">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Concentric sonar rings */}
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className="absolute rounded-full border border-cyan-400/20"
                        style={{
                          width: `${i * 20}%`,
                          height: `${i * 20}%`,
                          animation: `sonar ${3 + i}s ease-out infinite`,
                          animationDelay: `${i * 0.4}s`
                        }}
                      />
                    ))}
                    
                    {/* Center */}
                    <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-10" />
                    
                    {/* Scanning line */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      className="absolute w-full h-[2px] top-1/2 origin-center"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.8), transparent)'
                      }}
                    />

                    {/* Mock detections */}
                    <div className="absolute top-[30%] left-[60%] w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
                    <div className="absolute top-[65%] left-[35%] w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] animate-pulse" />
                    <div className="absolute top-[45%] left-[75%] w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)] animate-pulse" />
                  </div>

                  {/* Grid lines */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full" style={{
                      backgroundImage: `
                        linear-gradient(rgba(34,211,238,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(34,211,238,0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: '40px 40px'
                    }} />
                  </div>

                  {/* Labels */}
                  <div className="absolute top-3 left-3 text-[10px] mono text-cyan-400/60">
                    SSS • 600kHz • 75m RANGE
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] mono text-white/30">
                    <span>LAT: 15.2993</span>
                    <span>LNG: 74.1240</span>
                    <span className="text-cyan-400">● LIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 border-t border-white/5 bg-[#0f172a]/50">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-xs mono tracking-widest uppercase text-cyan-400/60 mb-3">The Challenge</p>
            <h2 className="text-[36px] font-bold leading-tight">Why Marine Debris Detection Needs AI</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { title: 'Ghost Nets Threaten Ecosystems', desc: 'Abandoned fishing gear entangles marine megafauna, damages coral reefs, and persists for decades as deadly traps.', icon: FaWater },
              { title: 'Manual Sonar Inspection is Slow', desc: 'Expert analysts spend 8+ hours reviewing a single survey. Thousands of images create impossible backlogs.', icon: FaChartLine },
              { title: 'Natural vs Artificial Confusion', desc: 'Rocks, sand ripples and ridges mimic debris acoustically. False positives waste ROV deployment resources.', icon: FaExclamationTriangle }
            ].map((card, i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:border-white/15 transition">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center mb-4">
                  <card.icon className="text-cyan-400" />
                </div>
                <h3 className="font-semibold mb-2">{card.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs mono tracking-widest uppercase text-cyan-400/60 mb-3">Solution Pipeline</p>
          <h2 className="text-[36px] font-bold">From Raw Sonar to Actionable Intelligence</h2>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-[40px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
            {[
              { step: '01', title: 'Upload Sonar Data', icon: FaSatelliteDish },
              { step: '02', title: 'AI Analysis', icon: FaBrain },
              { step: '03', title: 'Object Detection', icon: FaWater },
              { step: '04', title: 'Geotagging', icon: FaMapMarkedAlt },
              { step: '05', title: 'Hazard Assessment', icon: FaShieldAlt },
              { step: '06', title: 'Actionable Reports', icon: FaFileDownload }
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl glass flex flex-col items-center justify-center mb-4 border border-cyan-500/20">
                  <item.icon className="text-xl text-cyan-400 mb-1" />
                  <span className="text-[10px] mono text-cyan-400/60">{item.step}</span>
                </div>
                <h4 className="text-sm font-medium">{item.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-[#0f172a]/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { title: 'AI Object Detection', desc: 'YOLO-based model trained on 50k+ SSS images, detects 5 debris classes with 94% precision.' },
              { title: 'Sonar Noise Filtering', desc: 'Speckle reduction, contrast enhancement, and acoustic shadow analysis.' },
              { title: 'Confidence Scoring', desc: 'Four-tier confidence: Low to Very High, with automatic <50% filtering.' },
              { title: 'GPS Geotagging', desc: 'Automatic lat/lng extraction from metadata CSV and EXIF, with ±2m accuracy.' },
              { title: 'Hazard Prioritization', desc: '0-100 scoring based on type, size, confidence, and environmental sensitivity.' },
              { title: 'Interactive Marine Map', desc: 'Leaflet-based map with risk-colored markers and clustering.' },
              { title: 'Downloadable Reports', desc: 'JSON and CSV exports with AI interpretations and recommendations.' },
              { title: 'Role-Based Access', desc: 'Researcher and Admin roles with mission ownership and global analytics.' }
            ].map((f, i) => (
              <div key={i} className="glass rounded-2xl p-5">
                <h4 className="font-semibold text-sm mb-2">{f.title}</h4>
                <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-white/5 text-center">
        <p className="text-xs mono text-white/30 tracking-widest uppercase">OceanSentinel AI • Marine Conservation Technology • 2026</p>
      </footer>
    </div>
  );
};

export default Home;
