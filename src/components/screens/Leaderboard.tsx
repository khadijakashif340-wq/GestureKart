import React, { useState, useEffect } from 'react';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { LeaderboardEntry } from '@/types';
import { useGameStore } from '@/game/store';

const STORAGE_KEY = 'gesturekart_leaderboard_v1';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'Zainab Tariq', score: 1140, grade: 'S', date: '22 Oct 2026', level: 3 },
  { id: '2', name: 'Hamza Malik', score: 1080, grade: 'S', date: '21 Oct 2026', level: 3 },
  { id: '3', name: 'Bilal Ahmed', score: 1020, grade: 'A', date: '20 Oct 2026', level: 2 },
  { id: '4', name: 'Fatima Noor', score: 960, grade: 'A', date: '19 Oct 2026', level: 2 },
  { id: '5', name: 'Usman Ali', score: 890, grade: 'B', date: '18 Oct 2026', level: 1 },
];

export const Leaderboard: React.FC = () => {
  const setScreen = useGameStore((s) => s.setScreen);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      } else {
        setEntries(DEFAULT_LEADERBOARD);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
      }
    } catch {
      setEntries(DEFAULT_LEADERBOARD);
    }
  }, []);

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setEntries(DEFAULT_LEADERBOARD);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-12 z-20 overflow-y-auto pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-mono font-semibold text-cyan-400 tracking-wider">
            CIVIC HONOR ROLL
          </span>
          <h2 className="text-3xl font-black font-orbitron text-white">Canal Road Hall of Fame</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setScreen('landing')}>
          ✕ Close
        </Button>
      </div>

      {/* Leaderboard Table Card */}
      <GlassPanel className="my-6 p-6 max-w-3xl w-full mx-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-inter text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] border-b border-slate-700/80">
              <tr>
                <th className="p-3 pl-4">RANK</th>
                <th className="p-3">DRIVER</th>
                <th className="p-3">DATE</th>
                <th className="p-3 text-center">GRADE</th>
                <th className="p-3 text-right pr-4">CIVIC SCORE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {entries.map((entry, idx) => (
                <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 pl-4 font-bold text-cyan-400">
                    {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                  </td>
                  <td className="p-3 font-semibold text-white font-inter">{entry.name}</td>
                  <td className="p-3 text-slate-400 text-[11px]">{entry.date}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        entry.grade === 'S'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : entry.grade === 'A'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {entry.grade}
                    </span>
                  </td>
                  <td className="p-3 text-right pr-4 font-bold font-orbitron text-sm text-white">
                    {entry.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      {/* Footer */}
      <div className="flex justify-between items-center border-t border-slate-800/80 pt-4 text-xs text-slate-400">
        <button
          onClick={handleReset}
          className="text-slate-500 hover:text-slate-300 underline cursor-pointer"
        >
          Reset Local Scores
        </button>
        <Button variant="primary" onClick={() => setScreen('calibration')}>
          Take the Test →
        </Button>
      </div>
    </div>
  );
};
