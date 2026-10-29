import React from 'react';
import { motion } from 'framer-motion';

export const Loader: React.FC<{ message?: string; progress?: number }> = ({
  message = 'Loading 3D Simulation & Gesture Controls...',
  progress = 50,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center select-none">
      <div className="relative w-20 h-20 mb-6">
        {/* Animated glowing orbital rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 rounded-full border-2 border-emerald-500/20 border-b-emerald-400"
        />
        <div className="absolute inset-0 flex items-center justify-center text-cyan-400 font-orbitron font-bold text-xs">
          {Math.round(progress)}%
        </div>
      </div>

      <p className="text-sm font-medium text-slate-300 max-w-sm tracking-wide">
        {message}
      </p>

      {/* Progress track */}
      <div className="w-56 h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden border border-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
};
