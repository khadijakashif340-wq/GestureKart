import React from 'react';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { useGameStore } from '@/game/store';
import { audioEngine } from '@/audio/audioEngine';
import { voiceCoach } from '@/audio/voiceCoach';

export const Pause: React.FC<{ onResume: () => void; onRestart: () => void }> = ({
  onResume,
  onRestart,
}) => {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const setScreen = useGameStore((s) => s.setScreen);

  const handleVolumeChange = (vol: number) => {
    updateSettings({ volume: vol });
    audioEngine.setMasterVolume(vol);
  };

  const handleVoiceCoachToggle = (enabled: boolean) => {
    updateSettings({ voiceCoachEnabled: enabled });
    voiceCoach.setEnabled(enabled);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md pointer-events-auto">
      <GlassPanel className="w-full max-w-lg p-8 border-cyan-500/30 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-700/80 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-black font-orbitron text-white">SIMULATION PAUSED</h2>
            <span className="text-xs font-mono text-cyan-400">Canal Road Safety Mission</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onResume}>
            ✕
          </Button>
        </div>

        {/* Settings Sliders & Toggles */}
        <div className="space-y-5 text-xs font-mono text-slate-300">
          {/* Master Volume */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span>Master Sound Volume</span>
              <span className="text-cyan-400 font-bold">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Voice Coach Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
            <div>
              <span className="text-white font-semibold block">Spoken Voice Coach</span>
              <span className="text-[10px] text-slate-400">Real-time spoken auditory safety alerts</span>
            </div>
            <button
              onClick={() => handleVoiceCoachToggle(!settings.voiceCoachEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.voiceCoachEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.voiceCoachEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Graphics Quality */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
            <div>
              <span className="text-white font-semibold block">Graphics & Post-Processing</span>
              <span className="text-[10px] text-slate-400">Bloom, vignette & high resolution</span>
            </div>
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => updateSettings({ graphicsQuality: q })}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-colors ${
                    settings.graphicsQuality === q
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Showcase Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
            <div>
              <span className="text-white font-semibold block">Showcase Telemetry Mode</span>
              <span className="text-[10px] text-slate-400">Live rolling gesture graph display</span>
            </div>
            <button
              onClick={() => updateSettings({ showcaseMode: !settings.showcaseMode })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.showcaseMode ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.showcaseMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Button variant="ghost" onClick={onRestart}>
            Restart Mission
          </Button>
          <Button variant="primary" onClick={onResume} className="font-orbitron">
            Resume Driving →
          </Button>
        </div>

        <div className="mt-4 flex justify-center gap-4 text-xs text-slate-400">
          <button
            onClick={() => setScreen('calibration')}
            className="hover:text-cyan-400 underline cursor-pointer"
          >
            Recalibrate Body Posture
          </button>
          <span>•</span>
          <button
            onClick={() => setScreen('landing')}
            className="hover:text-red-400 underline cursor-pointer"
          >
            Exit to Main Menu
          </button>
        </div>
      </GlassPanel>
    </div>
  );
};
