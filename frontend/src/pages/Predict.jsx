import React, { useState } from 'react';
import { predictionApi } from '../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import PredictionCard from '../components/PredictionCard';

const Predict = () => {
  const [inputData, setInputData] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [batchFile, setBatchFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('text'); // text, url, video, batch
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv')) {
        toast.error('Only CSV files are supported.');
        setBatchFile(null);
        e.target.value = null;
        return;
      }
      setBatchFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError(''); 
    setResult(null);
    setBatchResults(null);
    
    try {
      if (activeTab === 'batch') {
        if (!batchFile) throw new Error('Please select a CSV file.');
        const res = await predictionApi.predictBatch(batchFile);
        setBatchResults(res.data);
        toast.success(`Successfully analyzed ${res.data.length} records!`);
      } else {
        let res;
        if (activeTab === 'video') {
          if (!videoInput.trim()) throw new Error('Please enter a video URL');
          res = await predictionApi.predictVideo(videoInput.trim());
        } else if (activeTab === 'url') {
          if (!urlInput.trim()) throw new Error('Please enter a valid URL');
          res = await predictionApi.predictUrl(urlInput.trim());
        } else {
          if (!inputData.trim()) throw new Error('Please enter text to analyze');
          res = await predictionApi.predictText(inputData.trim());
        }
        setResult(res.data);
        toast.success('Analysis complete!');
      }
    } catch (err) { 
      const errMsg = err.response?.data?.detail || err.message || 'Analysis failed. Please try again.';
      setError(errMsg); 
      toast.error(errMsg);
    }
    setLoading(false);
  };

  const isFake = result && (result.prediction_label === 'Fake News' || result.prediction_label === 'Fake Video' || result.is_fake);
  const confidence = result ? (result.confidence || result.confidence_score || 0) : 0;
  const isVideoResult = result && result.source_type === 'video';

  const tabWidth = { 'text': '0%', 'url': '25%', 'batch': '50%', 'video': '75%' }[activeTab];

  return (
    <>


      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <div className="mb-10 text-center">
          <div className="inline-block p-4 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4 shadow-[0_0_30px_rgba(0,255,135,0.15)]">
            <i className="fas fa-satellite-dish text-3xl text-primary-400"></i>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight">
            Target <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-cyan-400">Acquisition</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-3 max-w-2xl mx-auto">
            Input a news article URL, raw text, a CSV batch, or a video link. The GodSEye system will initiate deep neural analysis.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-dark-900/50 p-1.5 rounded-xl border border-white/5 inline-flex relative w-full sm:w-auto overflow-x-auto">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveTab('text'); setResult(null); setBatchResults(null); setError(''); }}
              className={`px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all relative z-10 flex-1 sm:flex-none ${activeTab === 'text' ? 'text-dark-950' : 'text-slate-400 hover:text-white'}`}
            >
              <i className="fas fa-align-left mr-2"></i> Text
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveTab('url'); setResult(null); setBatchResults(null); setError(''); }}
              className={`px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all relative z-10 flex-1 sm:flex-none ${activeTab === 'url' ? 'text-dark-950' : 'text-slate-400 hover:text-white'}`}
            >
              <i className="fas fa-link mr-2"></i> URL
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveTab('batch'); setResult(null); setBatchResults(null); setError(''); }}
              className={`px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all relative z-10 flex-1 sm:flex-none ${activeTab === 'batch' ? 'text-dark-950' : 'text-slate-400 hover:text-white'}`}
            >
              <i className="fas fa-file-csv mr-2"></i> Batch
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveTab('video'); setResult(null); setBatchResults(null); setError(''); }}
              className={`px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all relative z-10 flex-1 sm:flex-none ${activeTab === 'video' ? 'text-dark-950' : 'text-slate-400 hover:text-white'}`}
            >
              <i className="fas fa-video mr-2"></i> Video
            </motion.button>
            <div 
              className="absolute top-1.5 bottom-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-cyan-500 transition-all duration-300 shadow-[0_0_15px_rgba(0,255,135,0.3)] z-0"
              style={{ left: `calc(${tabWidth} + 6px)`, width: 'calc(25% - 12px)' }}
            ></div>
          </div>
        </div>

        {/* Input Panel */}
        <div className="glass-panel p-6 sm:p-10 mb-8 relative overflow-hidden group">
          <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent transform -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite]"></div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="relative">
              {activeTab === 'text' && (
                <textarea
                  rows="6"
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  className="w-full bg-dark-800/50 border border-white/10 rounded-xl p-5 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all font-mono text-sm resize-y"
                  placeholder="Paste raw news text here..."
                  required
                />
              )}
              {activeTab === 'url' && (
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-dark-800/50 border border-white/10 rounded-xl p-5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
                  placeholder="Paste an article URL here..."
                  required
                />
              )}
              {activeTab === 'batch' && (
                <div className="w-full bg-dark-800/50 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center border-dashed">
                  <i className="fas fa-cloud-upload-alt text-4xl text-slate-500 mb-4"></i>
                  <p className="text-slate-300 mb-2">Upload a CSV file with a "text" column</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-500/10 file:text-primary-400 hover:file:bg-primary-500/20 max-w-sm"
                    required
                  />
                </div>
              )}
              {activeTab === 'video' && (
                <input
                  type="url"
                  value={videoInput}
                  onChange={(e) => setVideoInput(e.target.value)}
                  className="w-full bg-dark-800/50 border border-white/10 rounded-xl p-5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
                  placeholder="Paste a video link (YouTube, MP4, etc.) here..."
                  required
                />
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono flex items-center gap-2">
                <i className="fas fa-lock text-slate-600"></i> Secure Analysis Protocol
              </span>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                type="submit" 
                disabled={
                  loading || 
                  (activeTab === 'text' && !inputData.trim()) || 
                  (activeTab === 'url' && !urlInput.trim()) || 
                  (activeTab === 'video' && !videoInput.trim()) ||
                  (activeTab === 'batch' && !batchFile)
                } 
                className="relative overflow-hidden group bg-gradient-to-r from-primary-600 to-cyan-600 hover:from-primary-500 hover:to-cyan-500 text-dark-950 px-8 py-3.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,255,135,0.3)] hover:shadow-[0_0_30px_rgba(0,255,135,0.5)]"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                {loading ? (
                  <><i className="fas fa-circle-notch fa-spin"></i> Initializing Neural Net...</>
                ) : (
                  <><i className="fas fa-microscope"></i> Initiate Scan</>
                )}
              </motion.button>
            </div>
          </form>
        </div>

        {/* Batch Results Table */}
        {batchResults && batchResults.length > 0 && (
          <div className="glass-panel p-6 sm:p-10 mb-8 animate-fade-in overflow-x-auto">
            <h2 className="text-2xl font-display font-bold text-white mb-6">Batch Analysis Report</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-3 text-slate-400 font-mono text-sm uppercase tracking-wider">ID</th>
                  <th className="p-3 text-slate-400 font-mono text-sm uppercase tracking-wider">Preview</th>
                  <th className="p-3 text-slate-400 font-mono text-sm uppercase tracking-wider">Prediction</th>
                  <th className="p-3 text-slate-400 font-mono text-sm uppercase tracking-wider">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {batchResults.map((res, i) => (
                  <tr key={res.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-sm text-slate-500">#{res.id}</td>
                    <td className="p-3 text-sm text-slate-300 max-w-xs truncate">{res.text_preview}</td>
                    <td className="p-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${res.is_fake ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {res.prediction_label}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-slate-300">
                      {Math.round(res.confidence * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detailed Results (Single) */}
        {result && (
          <div className="animate-slide-up space-y-6">
            <div className={`glass-card p-6 sm:p-10 relative overflow-hidden ${isFake ? 'border-red-500/30' : 'border-primary-500/30'}`}>
              
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                background: isFake ? 'radial-gradient(circle at center, #ef4444 0%, transparent 70%)' : 'radial-gradient(circle at center, #00FF87 0%, transparent 70%)'
              }}></div>

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl relative" style={{
                    background: isFake ? 'rgba(239,68,68,0.1)' : 'rgba(0,255,135,0.1)',
                    border: isFake ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(0,255,135,0.3)',
                    color: isFake ? '#ef4444' : '#00FF87',
                    boxShadow: isFake ? '0 0 40px rgba(239,68,68,0.2)' : '0 0 40px rgba(0,255,135,0.2)'
                  }}>
                    <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ background: isFake ? '#ef4444' : '#00FF87' }}></div>
                    <i className={`fas ${isFake ? 'fa-skull-crossbones' : 'fa-shield-check'}`}></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-4xl font-display font-black text-white uppercase tracking-tight">
                        {result.prediction_label || (isFake ? (isVideoResult ? 'Deepfake Detected' : 'Fake News') : 'Authentic')}
                      </h2>
                      {result.source_reputation && (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${result.source_reputation === 'trusted' ? 'bg-green-500/20 text-green-400' : result.source_reputation === 'suspicious' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {result.source_reputation.toUpperCase()} SOURCE
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-mono">
                      <i className={`fas ${isVideoResult ? 'fa-video' : 'fa-file-alt'} mr-1.5`}></i>
                      {isVideoResult ? 'Video Forensics Complete' : 'Text Analysis Complete'}
                    </p>
                  </div>
                </div>
                
                <div className="glass p-6 rounded-2xl text-center min-w-[140px] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1" style={{ background: isFake ? '#ef4444' : '#00FF87' }}></div>
                  <div className="text-5xl font-display font-black" style={{ color: isFake ? '#ef4444' : '#00FF87' }}>
                    {Math.round(confidence * 100)}%
                  </div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Confidence Level</div>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mb-8">
                <div className="flex justify-between mb-2 text-xs text-slate-400 font-mono uppercase tracking-wider">
                  <span>Deception Unlikely</span>
                  <span>Deception Highly Probable</span>
                </div>
                <div className="w-full h-4 rounded-full overflow-hidden bg-dark-900 border border-white/5 relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMjBoMjBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xOSAxOUgxVjFoMTh2MTh6IiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-50 z-10"></div>
                  
                  <div className="h-full rounded-full transition-all duration-1500 ease-out relative z-0" style={{
                    width: `${Math.round(confidence * 100)}%`,
                    background: isFake ? 'linear-gradient(90deg, #ef4444, #b91c1c)' : 'linear-gradient(90deg, #00FF87, #059669)',
                    boxShadow: isFake ? '0 0 20px rgba(239,68,68,0.6)' : '0 0 20px rgba(0,255,135,0.6)',
                  }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Processing Time', value: `${result.processing_time_ms?.toFixed(0) || '—'}ms`, icon: 'fa-microchip' },
                  { label: 'Model Engine', value: result.model_version || (isVideoResult ? 'Vision-Transformer v2' : 'NLP-BERT v4'), icon: 'fa-brain' },
                  { label: 'Reliability Index', value: confidence >= 0.8 ? 'High' : confidence >= 0.5 ? 'Medium' : 'Low', icon: 'fa-fingerprint' },
                  { label: isVideoResult ? 'Frames Analyzed' : 'Keywords Flagged', value: isVideoResult ? (result.frames_analyzed || '120') : (result.important_keywords?.length || 0), icon: isVideoResult ? 'fa-film' : 'fa-tags' },
                ].map((meta, i) => (
                  <div key={i} className="bg-dark-800/50 border border-white/5 p-4 rounded-xl text-center hover:bg-dark-700/50 transition-colors">
                    <i className={`fas ${meta.icon} text-lg mb-2 block text-slate-400 group-hover:text-cyan-400 transition-colors`}></i>
                    <div className="text-base font-bold text-white font-mono">{meta.value}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{meta.label}</div>
                  </div>
                ))}
              </div>

              {/* Video Specific Analytics (Mock) */}
              {isVideoResult && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                  <div className="bg-dark-800/30 border border-white/5 p-4 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Facial Manipulation</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-dark-900 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: isFake ? '85%' : '12%' }}></div>
                      </div>
                      <span className="text-xs font-mono text-cyan-400">{isFake ? '85%' : '12%'}</span>
                    </div>
                  </div>
                  <div className="bg-dark-800/30 border border-white/5 p-4 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Audio-Visual Sync</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-dark-900 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: isFake ? '62%' : '98%' }}></div>
                      </div>
                      <span className="text-xs font-mono text-purple-400">{isFake ? '62%' : '98%'}</span>
                    </div>
                  </div>
                  <div className="bg-dark-800/30 border border-white/5 p-4 rounded-xl">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Artifact Detection</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-dark-900 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 transition-all duration-1000" style={{ width: isFake ? '78%' : '5%' }}></div>
                      </div>
                      <span className="text-xs font-mono text-pink-400">{isFake ? '78%' : '5%'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Explanation Panel */}
            {result.explanation && (
              <div className="glass-card p-6 sm:p-8 mt-6 border-l-4" style={{ borderColor: isFake ? '#ef4444' : '#00FF87' }}>
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-widest">
                  <i className="fas fa-info-circle text-primary-400"></i> Analysis Explanation
                </h3>
                <p className="text-slate-300 font-mono text-sm leading-relaxed">
                  {result.explanation.split('').map((char, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.05, delay: index * 0.01 }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </p>
              </div>
            )}

            {/* Keywords Panel (for text) */}
            {result.important_keywords && result.important_keywords.length > 0 && !isVideoResult && (
              <div className="glass-card p-6 sm:p-8">
                <h3 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2 uppercase tracking-widest">
                  <i className="fas fa-crosshairs text-cyan-500"></i> Semantic Triggers Identified
                </h3>
                <div className="flex flex-wrap gap-3">
                  {result.important_keywords.map((kw, i) => (
                    <span key={i} className="px-4 py-2 rounded-lg text-sm font-mono" style={{
                      background: 'rgba(96,239,255,0.05)',
                      color: '#60EFFF',
                      border: '1px solid rgba(96,239,255,0.1)'
                    }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Predict;