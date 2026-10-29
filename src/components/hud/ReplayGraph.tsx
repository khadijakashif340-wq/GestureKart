import React from 'react';
import { ViolationRecord, PositiveEventRecord } from '@/types';
import { formatDistance } from '@/lib/utils';

export interface ReplayGraphProps {
  totalDistance: number;
  totalTime: number;
  violations: ViolationRecord[];
  positiveEvents: PositiveEventRecord[];
  width?: number | string;
  height?: number;
}

export const ReplayGraph: React.FC<ReplayGraphProps> = ({
  totalDistance,
  violations,
  positiveEvents,
  width = '100%',
  height = 90,
}) => {
  const maxDist = Math.max(totalDistance, 100);

  return (
    <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/60 select-none" style={{ width }}>
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-2">
        <span className="font-semibold text-slate-300">CANAL ROAD MISSION TIMELINE & EVENTS</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Bonus / Stop
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-400" /> Infraction
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 100">
          {/* Background guide lines */}
          <line x1="0" y1="50" x2="1000" y2="50" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2" strokeDasharray="4 4" />

          {/* Road baseline with gradient */}
          <line x1="0" y1="50" x2="1000" y2="50" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" opacity="0.75" />

          {/* Start and Finish markers */}
          <circle cx="10" cy="50" r="5" fill="#06b6d4" />
          <text x="10" y="78" fill="#94a3b8" fontSize="18" textAnchor="middle" fontFamily="monospace">
            0m
          </text>

          <circle cx="990" cy="50" r="5" fill="#10b981" />
          <text x="980" y="78" fill="#94a3b8" fontSize="18" textAnchor="end" fontFamily="monospace">
            {formatDistance(totalDistance)}
          </text>

          {/* Positive Events (Green Markers above line) */}
          {positiveEvents.map((evt, idx) => {
            const x = Math.max(20, Math.min(980, (evt.distance / maxDist) * 1000));
            return (
              <g key={`pos-${idx}`}>
                <line x1={x} y1="50" x2={x} y2="24" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle cx={x} cy="24" r="6" fill="#10b981" />
                <title>{`${evt.title} at ${evt.distance}m (+${evt.bonus})`}</title>
              </g>
            );
          })}

          {/* Violations (Red Markers below line) */}
          {violations.map((v, idx) => {
            const x = Math.max(20, Math.min(980, (v.distance / maxDist) * 1000));
            return (
              <g key={`viol-${idx}`}>
                <line x1={x} y1="50" x2={x} y2="76" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" />
                <circle cx={x} cy="76" r="6" fill="#ef4444" />
                <title>{`${v.title} at ${v.distance}m (-${v.penalty})`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2">
        <span>Mall Road (Start)</span>
        <span className="text-slate-300">
          {violations.length} Infractions • {positiveEvents.length} Discipline Bonuses
        </span>
        <span>Sector Destination</span>
      </div>
    </div>
  );
};
