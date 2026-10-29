import React from 'react';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { useGameStore } from '@/game/store';

export const HowItWorks: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);

  const cards = [
    {
      title: 'Steer Left & Right',
      urdu: 'دائیں یا بائیں مڑیں',
      gesture: 'Lean Your Torso Laterally',
      desc: 'Shift your upper body sideways. Your shoulder-to-hip angle controls the steering rack. A 4° deadzone keeps you stable, and 22° gives full steering lock.',
      badge: '4° Deadzone • 22° Full Lock',
      color: '#06b6d4',
      icon: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 stroke-cyan-400 fill-none" strokeWidth="4">
          <circle cx="50" cy="22" r="8" fill="#06b6d4" />
          <path d="M 50 30 L 50 62 L 35 90 M 50 62 L 65 90" strokeLinecap="round" />
          {/* Leaning shoulders & arms */}
          <path d="M 32 38 L 68 46" strokeLinecap="round" />
          <path d="M 20 50 Q 50 75 80 50" strokeDasharray="4 4" stroke="#94a3b8" />
        </svg>
      ),
    },
    {
      title: 'Emergency Brake',
      urdu: 'ایمرجنسی بریک لگائیں',
      gesture: 'Raise Right Hand Above Head',
      desc: 'Lift your right palm high above your head to trigger instantaneous hydraulic deceleration. Hold for 150ms to latch the brake at red traffic signals.',
      badge: 'Right Wrist > Nose Line',
      color: '#ef4444',
      icon: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 stroke-red-400 fill-none" strokeWidth="4">
          <circle cx="45" cy="35" r="8" fill="#ef4444" />
          <path d="M 45 43 L 45 75 L 35 92 M 45 75 L 55 92" strokeLinecap="round" />
          {/* Raised right hand */}
          <path d="M 45 50 L 68 30 L 68 12" strokeLinecap="round" />
          <circle cx="68" cy="10" r="5" fill="#ef4444" />
          <path d="M 45 50 L 25 65" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: 'Speed Control',
      urdu: 'رفتار پر قابو رکھیں',
      gesture: 'Distance Between Wrists',
      desc: 'Hold a virtual steering wheel in mid-air. Move hands wider apart to accelerate up to 95 km/h, or bring hands closer together to cruise at relaxed canal speed.',
      badge: 'Normalized to Shoulder Width',
      color: '#10b981',
      icon: (
        <svg viewBox="0 0 100 100" className="w-16 h-16 stroke-emerald-400 fill-none" strokeWidth="4">
          <circle cx="50" cy="25" r="8" fill="#10b981" />
          <path d="M 50 33 L 50 65 L 40 90 M 50 65 L 60 90" strokeLinecap="round" />
          {/* Outstretched hands */}
          <path d="M 22 45 L 40 45 M 60 45 L 78 45" strokeLinecap="round" />
          <circle cx="20" cy="45" r="4" fill="#10b981" />
          <circle cx="80" cy="45" r="4" fill="#10b981" />
          <path d="M 24 45 L 76 45" strokeDasharray="3 3" stroke="#cbd5e1" />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-12 z-20 overflow-y-auto pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-mono font-semibold text-cyan-400 tracking-wider">
            NATURAL USER INTERFACE
          </span>
          <h2 className="text-3xl font-black font-orbitron text-white">How Body Gestures Work</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setScreen('landing')}>
          ✕ Close
        </Button>
      </div>

      {/* 3 Gesture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        {cards.map((c, i) => (
          <GlassPanel
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className="flex flex-col justify-between p-6 rounded-2xl border-white/10 hover:border-white/20"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700">
                  {c.icon}
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {c.badge}
                </span>
              </div>

              <h3 className="text-xl font-bold font-orbitron text-white">{c.title}</h3>
              <span className="text-xs font-urdu text-slate-400 block mb-2">{c.urdu}</span>
              <p className="text-sm font-semibold text-cyan-400 mb-2">{c.gesture}</p>
              <p className="text-xs text-slate-300 leading-relaxed">{c.desc}</p>
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Footer CTA & Keyboard Fallback note */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-t border-slate-800/80 pt-6">
        <div className="text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Keyboard Fallback Available: </span>
          Use A/D (Steer), Space (Brake), and W/S (Speed) anytime.
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => setScreen('landing')}>
            Back
          </Button>
          <Button variant="primary" onClick={() => setScreen('calibration')} className="px-8 font-orbitron">
            Proceed to Calibration →
          </Button>
        </div>
      </div>
    </div>
  );
};
