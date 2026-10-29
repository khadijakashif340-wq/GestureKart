import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { RingProgress } from '../ui/RingProgress';
import { ReplayGraph } from '../hud/ReplayGraph';
import { ReportTemplate } from '@/report/ReportTemplate';
import { generatePdfReport } from '@/report/generatePdf';
import { generatePngReport, generateSocialShareCard } from '@/report/generateImage';
import { useGameStore, mutableGameState } from '@/game/store';
import { compileRunSummary } from '@/game/systems/scoring';
import { generateClientRuleBasedInsights } from '@/services/fallbackInsights';
import { getGradeColor, formatTime, formatDistance } from '@/lib/utils';
import { audioEngine } from '@/audio/audioEngine';
import { RunSummary } from '@/types';

export const GameOver: React.FC<{
  onPlayAgain: () => void;
  onBackToMenu?: () => void;
}> = ({ onPlayAgain, onBackToMenu }) => {
  const store = useGameStore();
  const rawSummary = store.runSummary;

  // Auto-generate fallback summary if missing so screen NEVER renders blank!
  const summary: RunSummary = useMemo(() => {
    if (rawSummary) return rawSummary;
    const partial = {
      playerName: 'Lahore Commuter',
      score: store.score,
      distanceDriven: Math.max(store.distance, Math.round(mutableGameState.distanceTraveled)),
      timeElapsed: 60,
      levelReached: store.currentLevelIndex + 1,
      violations: store.violations,
      positiveEvents: store.positiveEvents,
    };
    const insights = generateClientRuleBasedInsights(partial);
    const compiled = compileRunSummary(
      'Lahore Commuter',
      store.score,
      partial.distanceDriven,
      60,
      store.currentLevelIndex + 1,
      store.violations,
      store.positiveEvents,
      insights
    );
    store.setRunSummary(compiled);
    return compiled;
  }, [rawSummary, store]);

  const [copiedCaption, setCopiedCaption] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);

  useEffect(() => {
    audioEngine.stopEngine();
    if (summary && (summary.grade === 'S' || summary.grade === 'A')) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#ffffff'],
      });
      audioEngine.playSuccess();
    }
  }, [summary]);

  const gradeColor = getGradeColor(summary.grade);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    await generatePdfReport(summary);
    setDownloadingPdf(false);
  };

  const handleDownloadPng = async () => {
    setDownloadingPng(true);
    await generatePngReport(summary);
    setDownloadingPng(false);
  };

  const handleShareCard = () => {
    generateSocialShareCard(summary);
    const caption = `🚗 I just scored ${summary.score} (Grade ${summary.grade} • ${summary.rankTitle}) on GestureKart — the physical-gesture 3D traffic simulator on Lahore Canal Road! Drive with your body: https://gesturekart.vercel.app`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(caption).catch(() => {});
    }
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 4000);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-10 z-20 overflow-y-auto pointer-events-auto">
      {/* Print target for jsPDF and html2canvas */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none" aria-hidden="true">
        <ReportTemplate summary={summary} />
      </div>

      {/* Header Banner */}
      <div className="flex flex-wrap justify-between items-center border-b border-slate-700/80 pb-4 gap-4">
        <div>
          <span className="text-xs font-mono font-semibold text-cyan-400 tracking-wider">
            MISSION EVALUATION COMPLETE
          </span>
          <h2 className="text-2xl md:text-3xl font-black font-orbitron text-white">Civic Driving Score Card</h2>
        </div>
        <div className="flex items-center gap-3">
          {onBackToMenu && (
            <Button variant="red" size="sm" onClick={onBackToMenu} title="Return to Main Menu">
              ← Back to Main Menu
            </Button>
          )}
          <div className="text-right font-mono text-xs text-slate-400">
            <span>{summary.date}</span>
          </div>
        </div>
      </div>

      {/* Main Scorecard Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 items-center">
        {/* Left: Overall Score & Letter Grade */}
        <GlassPanel glow="cyan" className="md:col-span-5 p-6 flex flex-col items-center text-center justify-between">
          <span className="text-xs font-mono text-slate-400 tracking-wider">
            OFFICIAL CIVIC SCORE
          </span>

          {/* Large Animated Score Counter */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="my-3 font-orbitron font-black text-6xl md:text-7xl text-white tracking-tight"
          >
            {summary.score}
          </motion.div>

          {/* Letter Grade Badge */}
          <div
            className="px-6 py-2 rounded-xl text-2xl font-black font-orbitron shadow-2xl mb-2"
            style={{
              backgroundColor: `${gradeColor}25`,
              color: gradeColor,
              border: `2px solid ${gradeColor}`,
            }}
          >
            GRADE {summary.grade}
          </div>

          <h3 className="font-bold text-base text-slate-200 mt-1">{summary.rankTitle}</h3>

          <div className="grid grid-cols-3 gap-2 w-full mt-6 text-center text-xs font-mono">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] block">DISTANCE</span>
              <span className="text-white font-bold">{formatDistance(summary.distanceDriven)}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] block">COMMUTE</span>
              <span className="text-white font-bold">{formatTime(summary.timeElapsed)}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] block">REACTION</span>
              <span className="text-cyan-400 font-bold">{summary.avgReactionTimeMs}ms</span>
            </div>
          </div>
        </GlassPanel>

        {/* Right: Core Competency Breakdown Rings */}
        <GlassPanel className="md:col-span-7 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-orbitron font-bold text-sm text-slate-200 mb-4">
              Core Civic Competencies
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: 'Signal Obedience', val: summary.breakdown.signalObedience, color: '#10b981' },
                { label: 'Lane Discipline', val: summary.breakdown.laneDiscipline, color: '#06b6d4' },
                { label: 'Pedestrian Yielding', val: summary.breakdown.pedestrianSafety, color: '#f59e0b' },
                { label: 'Speed Control', val: summary.breakdown.speedControl, color: '#8b5cf6' },
              ].map((c, i) => (
                <div key={i} className="flex flex-col items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <RingProgress progress={c.val / 100} size={64} strokeWidth={5} color={c.color}>
                    <span className="font-mono font-bold text-xs text-white">{c.val}%</span>
                  </RingProgress>
                  <span className="text-[11px] text-slate-300 font-medium mt-2 leading-tight">
                    {c.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Civic Insights Reveal */}
            <div className="mt-6 p-4 rounded-xl bg-slate-900/70 border border-slate-700/80">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase">
                  Civic Insights & Driving Analysis
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-2">
                "{summary.insights.headline}"
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                {summary.insights.tips.map((tip, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-400 italic mt-3 border-t border-slate-800 pt-2">
                {summary.insights.closingLine}
              </p>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Mission Timeline & Infraction Replay Graph */}
      <div className="my-2">
        <ReplayGraph
          totalDistance={summary.distanceDriven}
          totalTime={summary.timeElapsed}
          violations={summary.violations}
          positiveEvents={summary.positiveEvents}
        />
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="emerald"
            size="lg"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="font-bold shadow-glow-emerald"
          >
            {downloadingPdf ? '⏳ Generating PDF...' : '📄 Download Official Report (PDF)'}
          </Button>

          <Button variant="ghost" size="lg" onClick={handleDownloadPng} disabled={downloadingPng}>
            {downloadingPng ? 'Saving...' : '🖼 Save PNG Image'}
          </Button>

          <Button variant="amber" size="lg" onClick={handleShareCard}>
            {copiedCaption ? '✓ Caption & Card Copied!' : '🚀 Share Score Card'}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {onBackToMenu && (
            <Button variant="outline" size="lg" onClick={onBackToMenu}>
              ← Back to Menu
            </Button>
          )}

          <Button variant="primary" size="lg" onClick={onPlayAgain} className="px-8 font-orbitron font-bold">
            Drive Again →
          </Button>
        </div>
      </div>
    </div>
  );
};
