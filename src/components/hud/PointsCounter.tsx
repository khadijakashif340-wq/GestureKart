import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/game/store';

export const PointsCounter: React.FC = () => {
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);

  return (
    <div className="flex flex-col items-center select-none">
      <span className="text-[10px] font-mono tracking-widest text-slate-400 font-semibold mb-0.5">
        CIVIC POINTS
      </span>

      <div className="flex items-baseline gap-2">
        <motion.div
          key={score}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`font-orbitron font-black text-3xl tracking-tight ${
            score < 400 ? 'text-red-400' : score < 750 ? 'text-amber-400' : 'text-emerald-400'
          }`}
        >
          {score}
        </motion.div>

        {/* Clean Combo Multiplier */}
        {combo > 1.0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xs font-orbitron font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
          >
            ×{combo.toFixed(1)}
          </motion.span>
        )}
      </div>
    </div>
  );
};
