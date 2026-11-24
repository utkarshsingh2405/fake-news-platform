import React, { useEffect, useState } from 'react';
import { predictionApi } from '../services/api';
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { animate } from 'framer-motion';

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

const Analytics = () => {
  const [stats, setStats] = useState({ total_predictions: 0, fake_news_count: 0, real_news_count: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      predictionApi.getStats(),
      predictionApi.getHistory(0, 50)
    ]).then(([statsRes, histRes]) => {
      setStats(statsRes.data);
      setHistory(histRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Process data for charts
  const pieData = [
    { name: 'Fake News', value: stats.fake_news_count || 0 },
    { name: 'Real News', value: stats.real_news_count || 0 },
  ];
  const PIE_COLORS = ['#ef4444', '#00FF87'];

  // Confidence distribution
  const confBuckets = [
    { range: '0-20%', count: 0 },
    { range: '20-40%', count: 0 },
    { range: '40-60%', count: 0 },
    { range: '60-80%', count: 0 },
    { range: '80-100%', count: 0 },
  ];
  history.forEach(p => {
    const c = (p.confidence_score || p.confidence || 0) * 100;
    if (c < 20) confBuckets[0].count++;
    else if (c < 40) confBuckets[1].count++;
    else if (c < 60) confBuckets[2].count++;
    else if (c < 80) confBuckets[3].count++;
    else confBuckets[4].count++;
  });

  // Daily predictions (from history timestamps)
  const dailyMap = {};
  history.forEach(p => {
    const day = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyMap[day] = (dailyMap[day] || 0) + 1;
  });
  const dailyData = Object.entries(dailyMap).map(([date, count]) => ({ date, predictions: count })).slice(-7);

  // Average confidence
  const avgConf = history.length > 0
    ? history.reduce((sum, p) => sum + (p.confidence_score || p.confidence || 0), 0) / history.length
    : 0;

  const fakeRatio = stats.total_predictions > 0 ? ((stats.fake_news_count / stats.total_predictions) * 100).toFixed(1) : '0';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass p-3 rounded-lg text-sm" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-white font-semibold">{label}</p>
          {payload.map((entry, i) => (
            <p key={i} style={{ color: entry.color || '#60EFFF' }} className="text-xs mt-1">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>


      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <span className="eyebrow mb-1 inline-block">Insights</span>
        <h1 className="text-3xl font-display font-bold text-white">Analytics & Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Visual breakdown of your prediction history and model performance.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Predictions', value: stats.total_predictions, icon: 'fa-chart-bar', color: '#60EFFF' },
          { label: 'Avg Confidence', value: Math.round(avgConf * 100), suffix: '%', icon: 'fa-bullseye', color: '#00FF87' },
          { label: 'Fake News Ratio', value: parseFloat(fakeRatio), suffix: '%', icon: 'fa-exclamation-circle', color: '#ef4444' },
          { label: 'Articles Analyzed', value: history.length, icon: 'fa-file-alt', color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5 stat-card">
            <div className="flex items-center gap-2 mb-2">
              <i className={`fas ${s.icon} text-xs`} style={{ color: s.color }}></i>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{s.label}</span>
            </div>
            <div className="text-2xl font-display font-black text-white">
              {loading ? (
                <div className="h-8 bg-white/5 rounded animate-pulse w-2/3"></div>
              ) : (
                <>
                  <CountUp to={s.value} />{s.suffix || ''}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Area Chart - Predictions Over Time */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <i className="fas fa-chart-area" style={{ color: '#00FF87' }}></i> Predictions Over Time
          </h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF87" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00FF87" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="predictions" stroke="#00FF87" fill="url(#areaGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>

        {/* Pie Chart - Fake vs Real */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <i className="fas fa-chart-pie" style={{ color: '#60EFFF' }}></i> Fake vs Real Distribution
          </h3>
          {stats.total_predictions > 0 ? (
            <div className="flex items-center justify-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: '#ef4444' }}></div>
                  <span className="text-sm text-slate-300">Fake News ({stats.fake_news_count})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: '#00FF87' }}></div>
                  <span className="text-sm text-slate-300">Real News ({stats.real_news_count})</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Bar Chart - Confidence Distribution */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <i className="fas fa-signal" style={{ color: '#8b5cf6' }}></i> Confidence Score Distribution
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={confBuckets}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60EFFF" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#60EFFF" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>
    </>
  );
};

export default Analytics;