import React from 'react'
import ConfidenceBar from './ConfidenceBar'
import { motion } from 'framer-motion'

const PredictionCard = ({ prediction, compact = false }) => {
  const isFake = prediction.prediction_label === 'Fake News' || prediction.prediction_result === true || prediction.is_fake === true
  const confidence = prediction.confidence || prediction.confidence_score || 0
  const label = prediction.prediction_label || (isFake ? 'Fake News' : 'Real News')
  const keywords = prediction.important_keywords || []
  
  const renderHighlightedText = (text, contributions) => {
    if (!text || !contributions || contributions.length === 0) return `"${text}"`;
    
    // Sort contributions by term length descending so we match longer phrases first
    const sortedContribs = [...contributions].sort((a, b) => b.term.length - a.term.length);
    
    // Create a regex to match any of the terms (case insensitive)
    const termsPattern = sortedContribs.map(c => c.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${termsPattern})`, 'gi');
    
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      const lowerPart = part.toLowerCase();
      const match = sortedContribs.find(c => c.term.toLowerCase() === lowerPart);
      
      if (match) {
        const isFake = match.direction === 'fake';
        // Normalize opacity between 0.2 and 0.8 based on score
        const opacity = Math.min(Math.max(match.contribution * 2, 0.2), 0.8);
        const bgColor = isFake ? `rgba(239, 68, 68, ${opacity})` : `rgba(0, 255, 135, ${opacity})`;
        const textColor = isFake ? '#ffcccc' : '#ccffcc';
        
        return (
          <span 
            key={i} 
            className="px-1 rounded cursor-help transition-colors duration-200 group relative inline-block"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {part}
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block px-2 py-1 bg-gray-900 text-white text-xs rounded z-10 whitespace-nowrap shadow-lg">
              {match.direction === 'fake' ? 'Fake signal' : 'Real signal'}: {(match.contribution * 100).toFixed(1)}%
            </span>
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className={`glass-card p-5 border-l-4 animate-fade-in ${isFake ? 'result-fake' : 'result-real'} h-full flex flex-col`}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isFake 
              ? 'text-red-400' 
              : 'text-green-400'
          }`} style={{ 
            background: isFake ? 'rgba(239,68,68,0.1)' : 'rgba(0,255,135,0.1)',
            border: isFake ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(0,255,135,0.2)'
          }}>
            <i className={`fas ${isFake ? 'fa-times' : 'fa-check'}`}></i>
          </div>
          <div>
            <span className={`text-base font-bold ${isFake ? 'text-red-400' : 'text-neon-green'}`}>
              {label}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              {prediction.created_at ? new Date(prediction.created_at).toLocaleString() : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
           <ConfidenceBar confidence={confidence} isFake={isFake} />
        </div>
      </div>
      
      {prediction.low_confidence && !compact && (
        <div className="mt-3 p-2.5 rounded-lg bg-yellow-900/30 border border-yellow-500/30 text-yellow-200 text-xs flex items-center gap-2">
          <i className="fas fa-exclamation-triangle"></i>
          <span><strong>Low Confidence:</strong> The model is unsure about this text.</span>
        </div>
      )}

      {prediction.linguistic_flags && prediction.linguistic_flags.note && !compact && (
        <div className="mt-3 p-2.5 rounded-lg bg-blue-900/30 border border-blue-500/30 text-blue-200 text-xs">
          <p className="font-semibold flex items-center gap-1.5 mb-1"><i className="fas fa-flag"></i> Linguistic Flags</p>
          <p>{prediction.linguistic_flags.note}</p>
        </div>
      )}

      {prediction.text_preview && (
        <div className={`mt-3 text-sm text-slate-300 border-l-2 border-slate-600 pl-3 py-1.5 leading-relaxed bg-dark-900/30 rounded-r-lg line-clamp-3 ${compact ? 'flex-grow' : ''}`}>
          {prediction.word_contributions && !compact ? renderHighlightedText(prediction.text_preview, prediction.word_contributions) : `"${prediction.text_preview}"`}
        </div>
      )}
      
      {prediction.explanation && !compact && (
        <div className="mt-4 p-3 rounded-lg bg-dark-900/50 border border-white/5">
          <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
            <i className="fas fa-info-circle text-primary-400"></i> Reasoning
          </p>
          <p className="text-xs text-slate-400">
            {prediction.explanation.split('').map((char, index) => (
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

      {keywords.length > 0 && !compact && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <i className="fas fa-tags text-xs text-neon-cyan"></i> Key Indicators
          </p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((keyword, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold" style={{ 
                background: 'rgba(96, 239, 255, 0.08)', 
                color: '#60EFFF',
                border: '1px solid rgba(96, 239, 255, 0.15)'
              }}>
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PredictionCard