import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

const ConfidenceBar = ({ confidence, isFake }) => {
  const [animatedConf, setAnimatedConf] = useState(0);
  const percentage = Math.round(confidence * 100);

  useEffect(() => {
    let start = 0;
    const end = percentage;
    if (start === end) {
      setAnimatedConf(end);
      return;
    }
    const duration = 1000;
    const incrementTime = Math.max(16, duration / (end || 1));
    const timer = setInterval(() => {
      start += 1;
      setAnimatedConf(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [percentage]);

  const data = [{ name: 'Confidence', value: animatedConf, fill: isFake ? '#ef4444' : '#00FF87' }];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-slate-400 text-xs font-mono uppercase tracking-widest mb-2">Confidence Level</div>
      <div className="relative w-[150px] h-[150px]">
        <RadialBarChart 
          width={150} 
          height={150} 
          cx={75} 
          cy={75} 
          innerRadius={50} 
          outerRadius={70} 
          barSize={10} 
          data={data} 
          startAngle={90} 
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            minAngle={15}
            background={{ fill: 'rgba(255,255,255,0.05)' }}
            clockWise={true}
            dataKey="value"
            cornerRadius={10}
          />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className={`text-3xl font-display font-black ${isFake ? 'text-red-400' : 'text-primary-400'} drop-shadow-[0_0_10px_currentColor]`}>
            {animatedConf}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceBar;