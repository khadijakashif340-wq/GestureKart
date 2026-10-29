import React, { useEffect, useState } from 'react';
import { mutableGameState } from '@/game/store';
import { SignalColor } from '@/types';

export const SignalIndicator: React.FC = () => {
  const [signal, setSignal] = useState<{ color: SignalColor; distanceM: number } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const signals = mutableGameState.activeSignals;
      const carZ = mutableGameState.carPosition.z;

      // Find closest upcoming signal
      const upcoming = signals
        .filter((s) => s.stopLineZ > carZ - 5)
        .sort((a, b) => a.stopLineZ - b.stopLineZ)[0];

      if (upcoming) {
        setSignal({
          color: upcoming.color,
          distanceM: Math.round(upcoming.stopLineZ - carZ),
        });
      } else {
        setSignal(null);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  if (!signal) return null;

  const colors = {
    green: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400',
    yellow: 'border-amber-500/40 bg-amber-950/30 text-amber-400',
    red: 'border-red-500/40 bg-red-950/30 text-red-400 animate-pulse',
  };

  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border backdrop-blur-md font-mono text-xs font-semibold ${
        colors[signal.color]
      }`}
    >
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          signal.color === 'green'
            ? 'bg-emerald-400 shadow-glow-emerald'
            : signal.color === 'yellow'
            ? 'bg-amber-400 shadow-glow-amber'
            : 'bg-red-400 shadow-glow-red'
        }`}
      />
      <span>
        {signal.color.toUpperCase()} • {signal.distanceM > 0 ? `${signal.distanceM}m` : 'STOP LINE'}
      </span>
    </div>
  );
};
