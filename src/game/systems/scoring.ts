import {
  ViolationRecord,
  PositiveEventRecord,
  CategoryBreakdown,
  RunSummary,
  CivicInsightsData,
} from '@/types';
import { calculateGrade } from '@/lib/utils';
import { SCORING_RULES } from '@/lib/constants';

export function calculateCategoryScores(
  violations: ViolationRecord[],
  _positiveEvents: PositiveEventRecord[]
): CategoryBreakdown {
  let signalPenalty = 0;
  let lanePenalty = 0;
  let pedPenalty = 0;
  let speedPenalty = 0;

  for (const v of violations) {
    if (v.type === 'red-light') signalPenalty += v.penalty;
    else if (v.type === 'lane-straddle') lanePenalty += v.penalty;
    else if (v.type === 'failed-yield' || v.title.includes('Pedestrian')) pedPenalty += v.penalty;
    else if (v.type === 'speeding') speedPenalty += v.penalty;
    else if (v.type === 'collision') {
      lanePenalty += v.penalty * 0.5;
      speedPenalty += v.penalty * 0.5;
    }
  }

  // Base 100 points per category minus infractions
  const signalObedience = Math.max(0, Math.min(100, Math.round(100 - signalPenalty * 0.35)));
  const laneDiscipline = Math.max(0, Math.min(100, Math.round(100 - lanePenalty * 0.7)));
  const pedestrianSafety = Math.max(0, Math.min(100, Math.round(100 - pedPenalty * 0.4)));
  const speedControl = Math.max(0, Math.min(100, Math.round(100 - speedPenalty * 0.8)));

  return {
    signalObedience,
    laneDiscipline,
    pedestrianSafety,
    speedControl,
  };
}

export function compileRunSummary(
  playerName: string,
  score: number,
  distanceDriven: number,
  timeElapsed: number,
  levelReached: number,
  violations: ViolationRecord[],
  positiveEvents: PositiveEventRecord[],
  insights: CivicInsightsData
): RunSummary {
  const breakdown = calculateCategoryScores(violations, positiveEvents);
  const gradeInfo = calculateGrade(score);

  const bonusPoints = positiveEvents.reduce((acc, e) => acc + e.bonus, 0);
  const penalties = violations.reduce((acc, v) => acc + v.penalty, 0);

  const stopsWithReaction = positiveEvents.filter((e) => e.reactionTimeMs);
  const avgReactionTimeMs =
    stopsWithReaction.length > 0
      ? Math.round(
          stopsWithReaction.reduce((acc, e) => acc + (e.reactionTimeMs || 0), 0) /
            stopsWithReaction.length
        )
      : 240;

  const averageSpeed = timeElapsed > 0 ? Math.round((distanceDriven / timeElapsed) * 3.6) : 48;
  const topSpeed = Math.min(95, Math.round(averageSpeed * 1.35));

  return {
    playerName: playerName || 'Lahore Commuter',
    date: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    score: Math.max(0, score),
    startingPoints: SCORING_RULES.STARTING_POINTS,
    bonusPoints,
    penalties,
    distanceDriven: Math.round(distanceDriven),
    timeElapsed: Math.round(timeElapsed),
    topSpeed,
    averageSpeed,
    levelReached,
    grade: gradeInfo.grade,
    rankTitle: gradeInfo.rankTitle,
    breakdown,
    violations,
    positiveEvents,
    insights,
    avgReactionTimeMs,
  };
}
