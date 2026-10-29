import { InsightsRequest } from './schema';

export function getSystemPrompt(): string {
  return `You are an elite urban driving evaluator for GestureKart, analyzing a simulated driver run on Lahore Canal Road.
Evaluate their telemetry, violations, and category scores.
Return a single JSON object strictly matching this schema:
{
  "headline": "Short punchy evaluation headline (max 8 words)",
  "driverPersonality": "Creative title (e.g. 'The Cautious Commuter', 'Master of Canal Road', 'The Drifting Cruiser')",
  "tips": [
    "Specific improvement tip 1 tied to their actual infractions",
    "Specific improvement tip 2 tied to their actual infractions",
    "Specific improvement tip 3 tied to their actual infractions"
  ],
  "closingLine": "Inspiring closing civic driving motto"
}
Never mention AI, LLMs or being a bot. Present strictly as native Civic Insights.`;
}

export function getUserPrompt(data: InsightsRequest): string {
  return `Driver: ${data.playerName}
Final Score: ${data.score} (Starting: 1000)
Distance Driven: ${data.distanceDriven} meters
Time: ${data.timeElapsed} seconds
Category Breakdown:
- Signal Obedience: ${data.breakdown.signalObedience}/100
- Lane Discipline: ${data.breakdown.laneDiscipline}/100
- Pedestrian Safety: ${data.breakdown.pedestrianSafety}/100
- Speed Regulation: ${data.breakdown.speedControl}/100

Violations Recorded (${data.violations.length} total):
${data.violations.map((v) => `- ${v.title} (-${v.penalty}): at ${v.distance}m`).join('\n') || 'None - Clean run'}

Output the evaluation JSON object now.`;
}

export function getHintPrompt(recentInfraction?: string, speed?: number, lane?: number): string {
  return `Context: Driver speed ${speed || 50} km/h, lane ${lane || 0}, latest event: ${recentInfraction || 'general drive'}.
Return a JSON object: {"hint": "Short 6-10 word actionable safety tip"}.`;
}

export function getHintSystemPrompt(): string {
  return 'You are an urban driving safety coach. Never mention AI. Keep tips under 10 words.';
}
