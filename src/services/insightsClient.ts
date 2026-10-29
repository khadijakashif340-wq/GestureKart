import { CivicInsightsData, RunSummary } from '@/types';
import { generateClientRuleBasedInsights } from './fallbackInsights';

export async function fetchCivicInsights(summary: Partial<RunSummary>): Promise<CivicInsightsData> {
  const payload = {
    playerName: summary.playerName || 'Lahore Commuter',
    score: summary.score ?? 1000,
    distanceDriven: summary.distanceDriven ?? 0,
    timeElapsed: summary.timeElapsed ?? 0,
    levelReached: summary.levelReached ?? 1,
    violations: (summary.violations || []).map((v) => ({
      type: v.type,
      title: v.title,
      penalty: v.penalty,
      timestamp: v.timestamp,
      distance: v.distance,
    })),
    breakdown: summary.breakdown || {
      signalObedience: 100,
      laneDiscipline: 100,
      pedestrianSafety: 100,
      speedControl: 100,
    },
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return {
        headline: data.headline,
        driverPersonality: data.driverPersonality,
        tips: data.tips,
        closingLine: data.closingLine,
        isFallback: data.isFallback,
      };
    }
  } catch (e) {
    console.info('Insights server unreachable, using local rule-based fallback analysis');
  }

  // Guaranteed fallback
  return generateClientRuleBasedInsights(summary);
}

let lastHintFetch = 0;
export async function fetchLiveHint(
  recentInfraction?: string,
  speed?: number,
  lane?: number
): Promise<string | null> {
  const now = performance.now();
  if (now - lastHintFetch < 20000) return null; // Max 1 per 20 seconds
  lastHintFetch = now;

  try {
    const res = await fetch('/api/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recentInfraction, speed, lane }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.hint;
    }
  } catch {
    // Non-blocking, ignore
  }
  return null;
}
