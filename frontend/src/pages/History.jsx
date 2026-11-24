import React, { useEffect, useState } from 'react';
import { predictionApi } from '../services/api';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    predictionApi.getHistory(page * limit, limit)
      .then(res => { setHistory(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page]);

  return (
    <>


      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <span className="eyebrow mb-1 inline-block">Records</span>
        <h1 className="text-3xl font-display font-bold text-white">Prediction History</h1>
        <p className="text-slate-400 text-sm mt-1">View all your past analysis results in one place.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <i className="fas fa-circle-notch fa-spin text-2xl" style={{ color: '#00FF87' }}></i>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-panel p-16 text-center">
          <i className="fas fa-inbox text-5xl text-slate-700 mb-4 block"></i>
          <h3 className="text-xl font-display font-bold text-white mb-2">No predictions yet</h3>
          <p className="text-slate-500 text-sm">Start analyzing news articles to build your history.</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-glass">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Text Preview</th>
                    <th>Verdict</th>
                    <th>Confidence</th>
                    <th>Keywords</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((pred) => {
                    const isFake = pred.prediction_result === true || pred.prediction_label === 'Fake News';
                    const conf = pred.confidence_score || pred.confidence || 0;
                    const keywords = pred.important_keywords || [];
                    return (
                      <tr key={pred.id}>
                        <td className="whitespace-nowrap text-xs text-slate-500">
                          {new Date(pred.created_at).toLocaleDateString()}<br/>
                          <span className="text-slate-600">{new Date(pred.created_at).toLocaleTimeString()}</span>
                        </td>
                        <td className="max-w-xs">
                          <p className="text-sm text-slate-300 truncate">{pred.text_preview || '—'}</p>
                        </td>
                        <td>
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${isFake ? 'badge-fake' : 'badge-real'}`}>
                            {pred.prediction_label || (isFake ? 'Fake' : 'Real')}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <div className="h-full rounded-full" style={{
                                width: `${Math.round(conf * 100)}%`,
                                background: isFake ? '#ef4444' : '#00FF87',
                              }} />
                            </div>
                            <span className="text-xs font-bold" style={{ color: isFake ? '#ef4444' : '#00FF87' }}>
                              {Math.round(conf * 100)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {keywords.slice(0, 3).map((kw, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(96,239,255,0.06)', color: '#60EFFF', fontSize: '0.65rem' }}>
                                {kw}
                              </span>
                            ))}
                            {keywords.length > 3 && <span className="text-xs text-slate-600">+{keywords.length - 3}</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-30"
            >
              <i className="fas fa-chevron-left mr-1"></i> Previous
            </button>
            <span className="text-sm text-slate-500">Page {page + 1}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={history.length < limit}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-30"
            >
              Next <i className="fas fa-chevron-right ml-1"></i>
            </button>
          </div>
        </>
      )}
      </div>
    </>
  );
};

export default History;