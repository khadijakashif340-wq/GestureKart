import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/game/store';

export const VoiceCoachBadge: React.FC = () => {
  const subtitle = useGameStore((s) => s.currentSubtitle);

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none select-none">
      <AnimatePresence>
        {subtitle && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-slate-950/85 border border-cyan-500/40 backdrop-blur-md shadow-2xl text-xs font-medium text-slate-200"
          >
            <span className="text-cyan-400 font-bold">🎙 COACH:</span>
            <span>"{subtitle}"</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
