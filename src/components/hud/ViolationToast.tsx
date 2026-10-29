import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/game/store';

export const ViolationToast: React.FC = () => {
  const activeToast = useGameStore((s) => s.activeToast);
  const setActiveToast = useGameStore((s) => s.setActiveToast);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [activeToast, setActiveToast]);

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none select-none">
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl font-inter ${
              activeToast.type === 'violation'
                ? 'bg-red-950/90 border-red-500/70 text-red-100 shadow-glow-red'
                : activeToast.type === 'bonus'
                ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-100 shadow-glow-emerald'
                : 'bg-cyan-950/90 border-cyan-500/70 text-cyan-100 shadow-glow-cyan'
            }`}
          >
            <div className="text-2xl">
              {activeToast.type === 'violation' ? '⚠️' : activeToast.type === 'bonus' ? '★' : '💡'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-bold text-sm tracking-wide">
                  {activeToast.title}
                </span>
                {activeToast.value !== undefined && (
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                      activeToast.value < 0 ? 'bg-red-500/30 text-red-300' : 'bg-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {activeToast.value > 0 ? `+${activeToast.value}` : activeToast.value}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-sm">{activeToast.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
