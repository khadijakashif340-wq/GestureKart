import React, { useEffect, useState } from 'react';
import { mutableGameState } from '@/game/store';

export const SpeedLimitSign: React.FC = () => {
  const [limit, setLimit] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setLimit(mutableGameState.currentSpeedLimit);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="w-11 h-11 rounded-full bg-white border-[3px] border-red-600 shadow-md flex items-center justify-center">
        <span className="font-orbitron font-extrabold text-slate-900 text-sm leading-none">
          {limit}
        </span>
      </div>
      <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5 tracking-wider">
        LIMIT
      </span>
    </div>
  );
};
