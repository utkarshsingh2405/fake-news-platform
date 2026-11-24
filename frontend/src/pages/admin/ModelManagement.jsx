import React, { useState } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ModelManagement = () => {
  const [loading, setLoading] = useState(false);

  const handleRetrain = async () => {
    setLoading(true);
    try {
      await adminApi.retrainModel(true);
      toast.success('Retraining sequence initiated in secure background threads.');
    } catch (err) { 
      toast.error('Failed to initiate retrain sequence.'); 
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-display font-bold text-white mb-8 border-b border-white/10 pb-4">
        Neural Engine <span className="text-primary-500">Diagnostics</span>
      </h1>
      
      <div className="glass-panel p-8 relative overflow-hidden group max-w-2xl">
        <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent transform -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite]"></div>
        
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.15)] shrink-0">
            <i className="fas fa-brain"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2 font-display tracking-wide uppercase">Core Architecture Re-alignment</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Initiate a full backpropagation pass over the verified baseline dataset. This will recalibrate the active weights for the GodSEye text classification model. Expected downtime: None (Runs in parallel worker).
            </p>
            
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleRetrain} 
              disabled={loading} 
              className="relative overflow-hidden group bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            >
              {loading ? (
                <><i className="fas fa-circle-notch fa-spin"></i> Initializing...</>
              ) : (
                <><i className="fas fa-sync-alt"></i> Execute Retrain Protocol</>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelManagement;