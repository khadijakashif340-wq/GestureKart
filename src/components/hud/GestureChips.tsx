import React, { useEffect, useState } from 'react';
import { mutableGameState } from '@/game/store';

export const GestureChips: React.FC = () => {
  const [telemetry, setTelemetry] = useState({
    steer: 0,
    isBraking: false,
    brakeHoldProgress: 0,
    speedTarget: 50,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const t = mutableGameState.recentTelemetry[0];
      if (t) {
        setTelemetry({
          steer: t.steer,
          isBraking: t.isBraking,
          brakeHoldProgress: t.brakeHoldProgress,
          speedTarget: Math.round(t.speedTarget),
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const steerPercent = Math.round(Math.abs(telemetry.steer) * 100);
  const steerDir = telemetry.steer < -0.1 ? 'LEFT' : telemetry.steer > 0.1 ? 'RIGHT' : 'CENTER';

  return (
    <div className="flex items-center gap-2 select-none text-xs font-mono">
      {/* Steering Lean Chip */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border backdrop-blur-md ${
          steerDir === 'CENTER'
            ? 'bg-slate-900/60 border-slate-700/60 text-slate-300'
            : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
        }`}
      >
        <span>{steerDir === 'LEFT' ? '←' : ''}</span>
        <span className="font-semibold">{steerDir}</span>
        <span>{steerPercent > 10 ? `${steerPercent}%` : ''}</span>
        <span>{steerDir === 'RIGHT' ? '→' : ''}</span>
      </div>

      {/* Emergency Brake Chip */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border backdrop-blur-md transition-colors ${
          telemetry.isBraking
            ? 'bg-red-950/60 border-red-500 text-red-300 shadow-glow-red animate-pulse'
            : telemetry.brakeHoldProgress > 0
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            : 'bg-slate-900/60 border-slate-700/60 text-slate-400'
        }`}
      >
        <span>✋</span>
        <span className="font-semibold">
          {telemetry.isBraking
            ? 'BRAKE LOCKED'
            : telemetry.brakeHoldProgress > 0
            ? `HOLD ${Math.round(telemetry.brakeHoldProgress * 100)}%`
            : 'BRAKE READY'}
        </span>
      </div>

      {/* Throttle / Hand Gap Chip */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-slate-700/60 bg-slate-900/60 text-slate-300 backdrop-blur-md">
        <span>↔</span>
        <span className="text-slate-400">TARGET:</span>
        <span className="text-emerald-400 font-bold">{telemetry.speedTarget} km/h</span>
      </div>
    </div>
  );
};
