import React from 'react';
import { RunSummary } from '@/types';
import { getGradeColor, formatTime, formatDistance } from '@/lib/utils';
import { ReplayGraph } from '@/components/hud/ReplayGraph';

export const ReportTemplate: React.FC<{ summary: RunSummary }> = ({ summary }) => {
  const gradeColor = getGradeColor(summary.grade);

  return (
    <div
      id="report-card-print-target"
      className="w-[800px] min-h-[1130px] bg-slate-900 text-slate-100 p-10 font-inter flex flex-col justify-between border border-slate-700 shadow-2xl relative overflow-hidden"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div>
        <div className="flex justify-between items-start border-b border-slate-700/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-orbitron font-extrabold text-3xl tracking-wider text-cyan-400">
                GESTUREKART
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                CANAL ROAD LAB
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Official Physical-Gesture Traffic Safety Evaluation • Lahore Canal Road
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-mono block">EVALUATION DATE</span>
            <span className="text-sm font-semibold text-slate-200">{summary.date}</span>
          </div>
        </div>

        {/* Driver & Big Score Banner */}
        <div className="grid grid-cols-12 gap-6 my-8 items-center bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
          <div className="col-span-8">
            <span className="text-xs font-mono text-cyan-400 tracking-wider">DRIVER PROFILE</span>
            <h2 className="text-2xl font-bold text-white mt-0.5">{summary.playerName}</h2>
            <p className="text-sm text-emerald-400 font-medium mt-1">
              {summary.rankTitle}
            </p>

            <div className="grid grid-cols-3 gap-4 mt-5 text-center">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-mono">DISTANCE</span>
                <span className="text-lg font-bold font-orbitron text-white">
                  {formatDistance(summary.distanceDriven)}
                </span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-mono">COMMUTE TIME</span>
                <span className="text-lg font-bold font-orbitron text-white">
                  {formatTime(summary.timeElapsed)}
                </span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[11px] text-slate-400 block font-mono">AVG REACTION</span>
                <span className="text-lg font-bold font-orbitron text-cyan-400">
                  {summary.avgReactionTimeMs} ms
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-4 flex flex-col items-center justify-center border-l border-slate-700 pl-6">
            <span className="text-xs font-mono text-slate-400 mb-1">CIVIC DRIVING SCORE</span>
            <div className="text-5xl font-black font-orbitron text-white tracking-tight">
              {summary.score}
            </div>
            <div
              className="mt-2 text-2xl font-black font-orbitron px-4 py-1 rounded-lg"
              style={{
                backgroundColor: `${gradeColor}20`,
                color: gradeColor,
                border: `1px solid ${gradeColor}60`,
              }}
            >
              GRADE {summary.grade}
            </div>
          </div>
        </div>

        {/* 4 Category Breakdown Bars */}
        <div className="mb-8">
          <h3 className="text-xs font-mono tracking-wider text-slate-400 uppercase mb-3">
            Core Competency Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Signal Obedience & Stopping', val: summary.breakdown.signalObedience, color: '#10b981' },
              { label: 'Lane Discipline & Transitions', val: summary.breakdown.laneDiscipline, color: '#06b6d4' },
              { label: 'Pedestrian & Zebra Yielding', val: summary.breakdown.pedestrianSafety, color: '#f59e0b' },
              { label: 'Speed Limit Regulation', val: summary.breakdown.speedControl, color: '#8b5cf6' },
            ].map((cat, i) => (
              <div key={i} className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-300">{cat.label}</span>
                  <span className="font-mono font-bold text-white">{cat.val}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cat.val}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Civic Insights Section */}
        <div className="mb-8 bg-slate-800/40 p-5 rounded-2xl border border-slate-700/70">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h3 className="text-xs font-mono tracking-wider text-cyan-400 uppercase font-semibold">
              Civic Insights & Driving Analysis
            </h3>
          </div>
          <h4 className="text-base font-semibold text-white mb-2.5">
            "{summary.insights.headline}"
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
            {summary.insights.tips.map((tip, idx) => (
              <li key={idx} className="leading-relaxed">
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Replay Timeline with Violation Markers */}
        <div className="mb-6">
          <ReplayGraph
            totalDistance={summary.distanceDriven}
            totalTime={summary.timeElapsed}
            violations={summary.violations}
            positiveEvents={summary.positiveEvents}
            height={70}
          />
        </div>

        {/* Violations Log Table */}
        <div>
          <h3 className="text-xs font-mono tracking-wider text-slate-400 uppercase mb-2">
            Traffic Infractions Log ({summary.violations.length})
          </h3>
          {summary.violations.length === 0 ? (
            <div className="text-center py-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-emerald-400 text-xs font-semibold">
              ★ ZERO INFRACTIONS RECORDED — EXEMPLARY CANAL ROAD DRIVE
            </div>
          ) : (
            <div className="border border-slate-700 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-800/90 text-slate-400 font-mono text-[11px]">
                  <tr>
                    <th className="p-2.5 pl-4">INFRACTION TYPE</th>
                    <th className="p-2.5">TIME</th>
                    <th className="p-2.5">DISTANCE</th>
                    <th className="p-2.5 text-right pr-4">PENALTY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {summary.violations.slice(0, 4).map((v, i) => (
                    <tr key={i} className="text-slate-300">
                      <td className="p-2.5 pl-4 font-medium text-white">{v.title}</td>
                      <td className="p-2.5 text-slate-400 font-mono">{formatTime(v.timestamp)}</td>
                      <td className="p-2.5 text-slate-400 font-mono">{formatDistance(v.distance)}</td>
                      <td className="p-2.5 text-right pr-4 font-mono font-bold text-red-400">
                        -{v.penalty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 pt-5 mt-6 flex justify-between items-center text-[11px] text-slate-400">
        <div>
          <span className="text-slate-300 font-semibold">Drive safe. Every rule saves a life.</span>
          <span className="block text-slate-400 text-[10px]">
            Lahore Traffic Police & Civic Safety Initiative Prototype
          </span>
        </div>
        <div className="font-mono text-slate-400">
          ID: GK-{Date.now().toString(36).toUpperCase()}
        </div>
      </div>
    </div>
  );
};
