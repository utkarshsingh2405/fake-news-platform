import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { predictionApi } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import CubeBackground from '../components/CubeBackground';

const Landing = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [introPhase, setIntroPhase] = useState(0); // 0: dot, 1: logo, 2: subtitle, 3: full UI
  
  // Sequence the intro animations
  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase(1), 1000); // Show logo after 1s
    const t2 = setTimeout(() => setIntroPhase(2), 2500); // Show subtitle after 2.5s
    const t3 = setTimeout(() => setIntroPhase(3), 4000); // Show full UI after 4s
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await predictionApi.predictText(text);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    }
    setLoading(false);
  };

  const isFake = result && (result.prediction_label === 'Fake News' || result.is_fake);
  const confidence = result ? (result.confidence || result.confidence_score || 0) : 0;

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans">
      
      {/* ─── FULLSCREEN 3D PARTICLE CUBE BACKGROUND ─── */}
      <CubeBackground />

      {/* ─── INTRO SEQUENCE ─── */}
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 ${introPhase === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Phase 0: Center Dot */}
        <div className={`w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_20px_#22d3ee] transition-all duration-700 ease-out absolute ${introPhase === 0 ? 'scale-100 opacity-100' : 'scale-[30] opacity-0'}`}></div>

        {/* Phase 1: Logo & Title Emerge */}
        <div className={`flex flex-col items-center transition-all duration-1000 absolute ${introPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <img src="/videos/screen.png" alt="GodSEye Logo" className={`w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_0_30px_rgba(0,255,135,0.5)] ${introPhase >= 1 ? 'animate-float' : ''}`} />
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mt-6 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
            GodSEye
          </h1>
        </div>

        {/* Phase 2: Subtitle */}
        <div className={`absolute mt-64 transition-all duration-1000 delay-300 ${introPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-xl md:text-2xl font-mono uppercase tracking-[0.3em] text-slate-300 font-bold">
            AI Fake News Detector
          </h2>
        </div>
      </div>

      {/* ─── MAIN HERO INTERFACE (Shows after intro) ─── */}
      <div className={`relative z-10 w-full min-h-screen flex flex-col transition-all duration-1000 delay-500 pt-24 ${introPhase === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full flex-grow flex flex-col items-center justify-center pb-20">
          
          <div className="text-center mb-10">
            <img src="/videos/screen.png" alt="GodSEye Mini" className="w-16 h-16 mx-auto mb-4 object-contain opacity-80" />
            <motion.h1 
              className="text-4xl md:text-5xl font-display font-black text-white mb-4"
              initial="hidden"
              animate={introPhase === 3 ? "visible" : "hidden"}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { staggerChildren: 0.1 }
                }
              }}
            >
              {"Uncover The ".split("").map((char, index) => (
                <motion.span key={`u-${index}`} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>{char}</motion.span>
              ))}
              <span className="gradient-text">
                {"Absolute Truth".split("").map((char, index) => (
                  <motion.span key={`a-${index}`} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>{char}</motion.span>
                ))}
              </span>
            </motion.h1>
            <motion.p 
              className="text-slate-400 max-w-2xl mx-auto text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: introPhase === 3 ? 1 : 0 }}
              transition={{ delay: 1.5 }}
            >
              Advanced neural networks instantly dissect web content to separate verified facts from deceptive misinformation.
            </motion.p>
          </div>

          {/* Quick Predict Glass Panel */}
          <div className="w-full max-w-3xl glass-panel p-6 sm:p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
            
            <form onSubmit={handlePredict} className="relative z-10">
              <div className="relative mb-6">
                <textarea
                  rows="4"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="input-glass text-base resize-none"
                  placeholder="Paste a news article URL or raw text to run forensics..."
                  required
                />
                <div className="absolute bottom-4 right-4 text-xs font-mono text-slate-500 bg-dark-900/80 px-2 py-1 rounded">
                  {text.length} chars
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <i className="fas fa-shield-alt text-cyan-500"></i> Encrypted Neural Analysis
                </span>
                <button type="submit" disabled={loading || !text.trim()} className="btn-primary w-full sm:w-auto px-8 py-3.5 flex items-center justify-center gap-3">
                  {loading ? (
                    <><i className="fas fa-circle-notch fa-spin"></i> Processing...</>
                  ) : (
                    <><i className="fas fa-crosshairs"></i> Initiate Scan</>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 animate-fade-in-up">
                <i className="fas fa-exclamation-triangle"></i> {error}
              </div>
            )}

            {/* Results Display */}
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`mt-6 p-6 rounded-2xl border backdrop-blur-xl transition-all ${isFake ? 'bg-red-500/5 border-red-500/30' : 'bg-primary-500/5 border-primary-500/30'}`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg ${isFake ? 'bg-red-500/10 text-red-500 shadow-red-500/20' : 'bg-primary-500/10 text-primary-500 shadow-primary-500/20'}`}>
                        <i className={`fas ${isFake ? 'fa-biohazard' : 'fa-check-circle'}`}></i>
                      </div>
                      <div>
                        <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">
                          {result.prediction_label || (isFake ? 'Fake News' : 'Authentic')}
                        </h3>
                        <p className="text-slate-400 text-xs font-mono mt-1">v{result.model_version} • {result.processing_time_ms?.toFixed(0)}ms</p>
                      </div>
                    </div>

                    <div className="bg-dark-900/60 p-4 rounded-xl border border-white/5 min-w-[120px] text-center">
                      <div className={`text-3xl font-display font-black ${isFake ? 'text-red-400' : 'text-primary-400'}`}>
                        {Math.round(confidence * 100)}%
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase mt-1">Confidence</div>
                    </div>
                    
                  </div>

                  {/* Explanation */}
                  {result.explanation && (
                    <div className="mt-6 text-sm text-slate-300 font-mono leading-relaxed border-l-2 border-slate-600 pl-4">
                      {result.explanation}
                    </div>
                  )}

                  {/* Keywords */}
                  {result.important_keywords?.length > 0 && (
                    <div className="mt-6">
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                        <i className="fas fa-tags text-cyan-500"></i> Top TF-IDF Features
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.important_keywords.map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-xs font-mono">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Live Demo Ticker */}
          <div className="mt-10 overflow-hidden whitespace-nowrap w-full border-y border-white/5 py-3 flex items-center">
            <span className="text-xs font-mono text-cyan-500 mr-4 shrink-0 px-4">LIVE SCANS</span>
            <motion.div 
              className="flex gap-8"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            >
              {[
                { label: 'FAKE', conf: '92%', src: 'twitter.com', text: '"Aliens land in NY..."' },
                { label: 'REAL', conf: '99%', src: 'reuters.com', text: '"Global markets close higher..."' },
                { label: 'FAKE', conf: '87%', src: 'unknown-blog', text: '"Secret cure for..."' },
                { label: 'REAL', conf: '95%', src: 'apnews.com', text: '"New election results..."' },
                { label: 'FAKE', conf: '92%', src: 'twitter.com', text: '"Aliens land in NY..."' },
                { label: 'REAL', conf: '99%', src: 'reuters.com', text: '"Global markets close higher..."' },
                { label: 'FAKE', conf: '87%', src: 'unknown-blog', text: '"Secret cure for..."' },
                { label: 'REAL', conf: '95%', src: 'apnews.com', text: '"New election results..."' },
              ].map((item, i) => (
                <span key={i} className="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <span className={item.label === 'FAKE' ? 'text-red-400' : 'text-primary-400'}>[{item.label} {item.conf}]</span>
                  <span className="text-slate-500">src: {item.src}</span>
                  <span className="text-slate-300 truncate max-w-[150px]">{item.text}</span>
                </span>
              ))}
            </motion.div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register" className="btn-primary px-8 py-3 w-full sm:w-auto text-center flex items-center justify-center gap-2">
              <i className="fas fa-user-plus"></i> Create Account
            </Link>
            <Link to="/login" className="btn-glass px-8 py-3 w-full sm:w-auto text-center flex items-center justify-center gap-2">
              <i className="fas fa-sign-in-alt"></i> Login to Dashboard
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Landing;