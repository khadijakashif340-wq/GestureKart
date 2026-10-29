import React, { useEffect, useState } from 'react';
import { mutableGameState } from '@/game/store';

export const Speedometer: React.FC = () => {
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    // 20Hz UI update interval is optimal for HUD speedometer
    const interval = setInterval(() => {
      setSpeed(Math.round(mutableGameState.carSpeed));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const maxSpeed = 120;

  return (
    <div className="relative flex flex-col items-center justify-center w-36 h-36 select-none">
      {/* Background Arc */}
      <svg className="w-36 h-36 transform rotate-90" viewBox="0 0 100 100">
        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="6"
          strokeDasharray="195 260"
          strokeDashoffset="-32"
          strokeLinecap="round"
        />
        {/* Dynamic Speed Arc */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={speed < 0 ? '#f59e0b' : speed > 75 ? '#ef4444' : speed > 60 ? '#f59e0b' : '#06b6d4'}
          strokeWidth="6"
          strokeDasharray="195 260"
          strokeDashoffset={195 - Math.min(1, Math.abs(speed) / maxSpeed) * 195 - 32}
          strokeLinecap="round"
          className="transition-all duration-75 ease-out"
        />
      </svg>

      {/* Speed Dial Center Value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="font-orbitron font-extrabold text-3xl text-white tracking-tight">
          {speed < 0 ? `R ${Math.abs(speed)}` : speed}
        </span>
        <span className={`font-mono text-[10px] font-semibold tracking-wider -mt-1 ${speed < 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
          {speed < 0 ? 'REVERSE' : 'KM / H'}
        </span>
      </div>
    </div>
  );
};
