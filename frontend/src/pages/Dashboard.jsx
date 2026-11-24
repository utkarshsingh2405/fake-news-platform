import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { predictionApi } from '../services/api';
import PredictionCard from '../components/PredictionCard';
import { animate, motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const CountUp = ({ to }) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, {
      duration: 1.5,
      onUpdate(val) {
        setValue(Math.round(val));
      }
    });
    return controls.stop;
  }, [to]);
  return <>{value}</>;
};

// Mock sparkline data for UI aesthetic
const generateSparkline = (base, volatility, length = 10) => {
  return Array.from({ length }, (_, i) => ({
    value: base + Math.random() * volatility - (volatility / 2)
  }));
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total_predictions: 0, fake_news_count: 0, real_news_count: 0 });
  const [recent, setRecent] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickResult, setQuickResult] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Sparkline data state
  const [sparklines] = useState({
    total: generateSparkline(100, 20),
    fake: generateSparkline(40, 10),
    real: generateSparkline(60, 15)
  });

  useEffect(() => {
    Promise.all([
      predictionApi.getStats().then(res => setStats(res.data)),
      predictionApi.getHistory(0, 3).then(res => setRecent(res.data))
    ]).catch(console.error).finally(() => setIsLoadingStats(false));
  }, []);

  const handleQuickPredict = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setQuickResult(null);
    try {
      let res;
      const dataStr = text.trim();
      
      if (dataStr.match(/^https?:\/\//i)) {
        res = await predictionApi.predictUrl(dataStr);
      } else {
        res = await predictionApi.predictText(dataStr);
      }
      
      setQuickResult(res.data);
      setText('');
      
      const statsRes = await predictionApi.getStats();
      setStats(statsRes.data);
      
      const histRes = await predictionApi.getHistory(0, 3);
      setRecent(histRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const statCards = [
    { 
      label: 'System Invocations', 
      desc: 'Total articles analyzed by GodSEye',
      value: stats.total_predictions, 
      icon: 'fa-microchip', 
      color: '#60EFFF',
      data: sparklines.total 
    },
    { 
      label: 'Deception Detected', 
      desc: 'Known fabricated or malicious content',
      value: stats.fake_news_count, 
      icon: 'fa-radiation', 
      color: '#ef4444',
      data: sparklines.fake 
    },
    { 
      label: 'Verified Authentic', 
      desc: 'Information passing credibility checks',
      value: stats.real_news_count, 
      icon: 'fa-shield-check', 
      color: '#00FF87',
      data: sparklines.real 
    },
  ];

  return (
    <>
      {/* Pure CSS Tech-Noir Background (Removes video choppiness) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050810]">
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
               backgroundSize: '32px 32px' 
             }}>
        </div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00FF87]/5 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-[#60EFFF]/5 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
              <span className="text-xs font-bold text-neon-green uppercase tracking-widest">Global Surveillance Node</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight">
              Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-white">Center</span>
            </h1>
            <p className="text-slate-400 mt-2 max-w-xl text-sm leading-relaxed">
              Welcome back, Operator <strong className="text-white">{user?.username || 'Unknown'}</strong>. Neural networks are online and processing real-time intelligence feeds.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="glass px-4 py-2 flex flex-col items-end border-white/5">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Model Status</span>
              <span className="text-sm font-mono text-neon-cyan"><i className="fas fa-circle-check mr-1"></i> OPTIMAL</span>
            </div>
          </div>
        </motion.div>

        {/* BENTO BOX GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
          
          {/* STATS CARDS (Span 4 cols each on large) */}
          {statCards.map((card, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className="glass-card lg:col-span-4 p-6 relative group overflow-hidden flex flex-col justify-between"
            >
              {/* Background Glow on Hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                   style={{ background: `radial-gradient(circle at top right, ${card.color}, transparent 60%)` }}></div>
              
              <div className="relative z-10 flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wider">{card.label}</h3>
                  <p className="text-slate-500 text-xs mt-1">{card.desc}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:rotate-12 duration-500" 
                     style={{ background: `${card.color}15`, borderColor: `${card.color}30`, color: card.color }}>
                  <i className={`fas ${card.icon}`}></i>
                </div>
              </div>

              <div className="relative z-10 flex items-end justify-between mt-auto">
                <div className="text-5xl font-display font-black tracking-tighter text-white">
                  {isLoadingStats ? (
                    <div className="h-12 bg-white/10 rounded animate-pulse w-24"></div>
                  ) : (
                    <CountUp to={card.value} />
                  )}
                </div>
                
                {/* Mini Graph */}
                <div className="w-24 h-12 opacity-50 group-hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={card.data}>
                      <Line type="monotone" dataKey="value" stroke={card.color} strokeWidth={2} dot={false} isAnimationActive={true} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          ))}

          {/* MAIN PREDICTOR (Span 8 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel lg:col-span-8 p-0 flex flex-col overflow-hidden relative"
          >
            {/* Decorative top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-neon-green to-neon-cyan"></div>
            
            <div className="p-8 flex flex-col flex-grow">
              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                  <i className="fas fa-radar" style={{ color: '#00FF87' }}></i> Immediate Analysis
                </h2>
                <p className="text-slate-400 text-sm mt-1">Input unverified text or a URL to trigger the neural classification sequence.</p>
              </div>

              <form onSubmit={handleQuickPredict} className="flex flex-col gap-4 flex-grow">
                <div className="relative flex-grow">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-full min-h-[140px] bg-dark-900/60 border border-white/10 rounded-2xl p-5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-neon-green/50 focus:ring-1 focus:ring-neon-green/50 transition-all font-mono text-sm resize-none shadow-inner"
                    placeholder="> Awaiting string or url input for deep verification..."
                    required
                  />
                  {/* Subtle decorative grid in textarea */}
                  <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden opacity-5"
                       style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-slate-500 font-mono"><i className="fas fa-shield-alt mr-1"></i> AES-256 Encrypted Stream</span>
                  <button type="submit" disabled={loading || !text.trim()} className="btn-primary py-3 px-8 text-sm font-bold flex items-center gap-2 group">
                    {loading ? (
                      <><i className="fas fa-circle-notch fa-spin"></i> Processing...</>
                    ) : (
                      <>Initialize Scan <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i></>
                    )}
                  </button>
                </div>
              </form>

              {quickResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 border-t border-white/10 pt-6"
                >
                  <PredictionCard prediction={quickResult} />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* QUICK LINKS / NAV (Span 4 cols) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-4 flex flex-col gap-6"
          >
            <div className="glass-panel p-6 flex-grow flex flex-col">
              <h2 className="text-lg font-display font-bold text-white mb-5 flex items-center gap-2">
                <i className="fas fa-network-wired text-neon-cyan"></i> Subsystems
              </h2>
              <div className="flex flex-col gap-3 flex-grow">
                
                <Link to="/predict" className="group relative overflow-hidden bg-dark-800/40 hover:bg-dark-700/50 border border-white/5 rounded-xl p-4 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-green/0 via-neon-green/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-lg bg-neon-green/10 border border-neon-green/20 text-neon-green flex items-center justify-center text-lg">
                      <i className="fas fa-file-alt"></i>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold group-hover:text-neon-green transition-colors">Batch Processing</h4>
                      <p className="text-xs text-slate-400 mt-1">Upload CSVs for mass analysis</p>
                    </div>
                  </div>
                </Link>

                <Link to="/history" className="group relative overflow-hidden bg-dark-800/40 hover:bg-dark-700/50 border border-white/5 rounded-xl p-4 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan flex items-center justify-center text-lg">
                      <i className="fas fa-database"></i>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold group-hover:text-neon-cyan transition-colors">Intelligence Logs</h4>
                      <p className="text-xs text-slate-400 mt-1">Access historical scan data</p>
                    </div>
                  </div>
                </Link>

                <Link to="/analytics" className="group relative overflow-hidden bg-dark-800/40 hover:bg-dark-700/50 border border-white/5 rounded-xl p-4 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-lg">
                      <i className="fas fa-chart-network"></i>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold group-hover:text-purple-400 transition-colors">Global Metrics</h4>
                      <p className="text-xs text-slate-400 mt-1">View system-wide trends</p>
                    </div>
                  </div>
                </Link>

              </div>
            </div>
          </motion.div>

          {/* RECENT ACTIVITY (Span 12 cols) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-12"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
                <i className="fas fa-list-ul text-slate-400"></i> Recent Intel
              </h2>
              <Link to="/history" className="text-xs font-bold text-neon-cyan uppercase tracking-widest hover:text-white transition-colors">
                Open Full Log <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoadingStats ? (
                Array(3).fill(0).map((_, idx) => (
                  <div key={idx} className="glass-card p-6 h-40 animate-pulse bg-white/5 border-white/5"></div>
                ))
              ) : recent.length > 0 ? (
                recent.map(pred => (
                  <div key={pred.id} className="transform hover:-translate-y-1 transition-transform duration-300">
                    <PredictionCard prediction={pred} compact={true} />
                  </div>
                ))
              ) : (
                <div className="col-span-3 glass-panel p-8 text-center text-slate-500 border-dashed border-2 border-white/10">
                  <i className="fas fa-folder-open text-3xl mb-3 opacity-50"></i>
                  <p>No intelligence logs found in this sector.</p>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
};

export default Dashboard;