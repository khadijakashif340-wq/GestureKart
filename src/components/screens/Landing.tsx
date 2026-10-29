import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { useGameStore } from '@/game/store';
import { STRINGS_EN, STRINGS_UR } from '@/lib/i18n';

export const Landing: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const lang = useGameStore((s) => s.settings.language);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const strings = lang === 'ur' ? STRINGS_UR : STRINGS_EN;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-12 z-20 pointer-events-auto">
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-glow-cyan">
            <span className="text-xl">🚗</span>
          </div>
          <div>
            <h1 className="font-orbitron font-black text-xl text-white tracking-widest leading-none">
              GESTUREKART
            </h1>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider">
              LAHORE CANAL ROAD EDITION
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => updateSettings({ language: lang === 'en' ? 'ur' : 'en' })}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 text-xs font-semibold hover:border-cyan-400 transition-colors"
          >
            {lang === 'en' ? 'اردو' : 'English'}
          </button>

          {/* Leaderboard CTA */}
          <Button variant="ghost" size="sm" onClick={() => setScreen('leaderboard')}>
            🏆 Top Drivers
          </Button>
        </div>
      </div>

      {/* Hero Center Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-xl self-start"
      >
        <h2 className="text-4xl md:text-6xl font-black font-orbitron text-white leading-tight tracking-tight">
          DRIVE WITH <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-300">
            YOUR BODY.
          </span>
        </h2>

        <p className="text-slate-300 text-base md:text-lg mt-4 leading-relaxed font-normal">
          {strings.tagline} Steer by leaning, brake by raising your hand, and master civic road safety with real-time feedback.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 mt-8">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setScreen('calibration')}
            className="text-base px-8 py-4 font-orbitron"
          >
            {strings.startDriving} →
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setScreen('how-it-works')}
            className="text-base px-6 py-4"
          >
            {strings.howItWorks}
          </Button>
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="flex flex-wrap justify-between items-center text-xs text-slate-400 border-t border-slate-800/80 pt-4">
        <span>Webcam Body-Gesture Tracking & Real-Time 3D Simulation</span>
        <span className="font-mono text-cyan-400">Zero Hardware Required • Pure Browser Experience</span>
      </div>
    </div>
  );
};
