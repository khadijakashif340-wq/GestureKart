import React from 'react';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { useGameStore } from '@/game/store';
import { LEVELS } from '@/lib/constants';
import { audioEngine } from '@/audio/audioEngine';

export const LevelSelect: React.FC<{ onStartLevel: (idx: number) => void }> = ({ onStartLevel }) => {
  const currentIdx = useGameStore((s) => s.currentLevelIndex);
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-12 z-20 overflow-y-auto pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-mono font-semibold text-cyan-400 tracking-wider">
            STEP 2 OF 2 • MISSION BRIEFING
          </span>
          <h2 className="text-3xl font-black font-orbitron text-white">Select Canal Road Sector</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setScreen('landing')}>
            ← Home
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setScreen('calibration')}>
            ← Posture
          </Button>
        </div>
      </div>

      {/* 3 Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        {LEVELS.map((lvl, idx) => (
          <GlassPanel
            key={lvl.id}
            glow={currentIdx === idx ? 'cyan' : 'none'}
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              audioEngine.playClick();
              onStartLevel(idx);
            }}
            className={`cursor-pointer transition-all border p-6 flex flex-col justify-between rounded-2xl ${
              currentIdx === idx ? 'border-cyan-400 bg-cyan-950/30' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  SECTOR 0{lvl.id}
                </span>
                <span className="text-xs font-mono font-semibold text-amber-400">
                  {lvl.speedLimit} KM/H MAX
                </span>
              </div>

              <h3 className="text-xl font-bold font-orbitron text-white">{lvl.name}</h3>
              <p className="text-xs font-urdu text-slate-400 my-1">{lvl.nameUrdu}</p>
              <p className="text-xs text-cyan-400 font-semibold mb-4">{lvl.subtitle}</p>

              <div className="space-y-2 text-xs text-slate-300 font-mono border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Distance Target:</span>
                  <span className="text-white font-bold">{lvl.targetDistance}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Time of Day:</span>
                  <span className="text-slate-200 capitalize">{lvl.timeOfDay.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Traffic Density:</span>
                  <span className="text-slate-200">{Math.round(lvl.trafficDensity * 100)}%</span>
                </div>
              </div>

              <div className="mt-4 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300">
                <span className="font-semibold text-amber-300 block mb-0.5">RULE FOCUS:</span>
                {lvl.ruleFocus}
              </div>
            </div>

            <Button
              variant={currentIdx === idx ? 'primary' : 'ghost'}
              className="mt-6 w-full font-orbitron text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onStartLevel(idx);
              }}
            >
              Drive Sector 0{lvl.id} →
            </Button>
          </GlassPanel>
        ))}
      </div>

      {/* Footer Instructions */}
      <div className="flex justify-between items-center border-t border-slate-800/80 pt-4 text-xs text-slate-400">
        <span>Runs seamlessly through Level 1 → 2 → 3 as you progress without crashing.</span>
        <span className="font-mono text-cyan-400">1000 Civic Points Banked</span>
      </div>
    </div>
  );
};
