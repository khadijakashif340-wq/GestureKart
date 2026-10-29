import { InsightsRequest, InsightsResponse } from './schema';

export function generateRuleBasedFallback(data: InsightsRequest): InsightsResponse {
  const { score, violations, breakdown } = data;

  let personality = 'The Canal Road Explorer';
  let headline = 'Steady Commute with Emerging Civic Awareness';
  const tips: [string, string, string] = [
    breakdown.signalObedience < 80
      ? 'Focus on early deceleration: scan signals from 50 meters out to ensure timely stops.'
      : 'Always monitor traffic signals from 50 meters out to ensure smooth deceleration.',
    breakdown.laneDiscipline < 80
      ? 'Keep your vehicle centered between lane markers to prevent disruption of high-speed canal traffic.'
      : 'Maintain steady center-lane alignment when cruising along the canal.',
    breakdown.pedestrianSafety < 80
      ? 'Anticipate pedestrian zebra crossings near major Lahore intersections.'
      : 'Yield proactively to crossing pedestrians at designated zebra crossings.',
  ];

  const redLightCount = violations.filter((v) => v.type === 'red-light').length;
  const speedCount = violations.filter((v) => v.type === 'speeding').length;
  const laneCount = violations.filter((v) => v.type === 'lane-straddle').length;
  const collisionCount = violations.filter((v) => v.type === 'collision').length;

  if (score >= 1050 && violations.length === 0) {
    personality = 'The Master of Canal Road';
    headline = 'Flawless Urban Discipline & Masterful Reflexes';
    tips[0] = 'Your anticipatory braking and lane positioning set the gold standard for Lahore traffic.';
    tips[1] = 'Maintain this exceptional scanning pattern during low-visibility night commutes.';
    tips[2] = 'Encourage fellow motorists to adopt identical safe-following distance practices.';
  } else if (score >= 900) {
    personality = 'The Exemplary Civic Motorist';
    headline = 'High Road Awareness with Minor Calibration Margins';
    if (laneCount > 0) {
      tips[0] = 'Focus on cleaner lane transitions: signal early and avoid straddling the central divider.';
    }
    if (speedCount > 0) {
      tips[1] = 'Calibrate your throttle hand gap to cruise precisely at the posted speed limit.';
    }
  } else if (redLightCount > 0) {
    personality = 'The Rushed Commuter';
    headline = 'Urgent Reflexes Requiring Stronger Signal Discipline';
    tips[0] = `You accumulated ${redLightCount} signal infraction(s). Raise your right hand promptly when yellow signals appear.`;
    tips[1] = 'Stopping before the white line preserves pedestrian right-of-way at zebra crossings.';
    tips[2] = 'Leave adequate buffer room behind leading auto-rickshaws when slowing down.';
  } else if (collisionCount > 0) {
    personality = 'The Impulsive Navigator';
    headline = 'Good Forward Momentum Needing Better Spatial Buffer';
    tips[0] = 'Keep a minimum 3-second gap behind Suzuki vans and buses on Canal Road.';
    tips[1] = 'Smooth torso leans provide more predictable vehicle stability than abrupt shifts.';
    tips[2] = 'Reduce speed in crowded multi-lane sections between Mall Road and Muslim Town.';
  } else if (laneCount > 0) {
    personality = 'The Drifting Cruiser';
    headline = 'Smooth Pace with Inconsistent Lane Centering';
    tips[0] = 'Avoid straddling the white lane dashes; choose a lane and hold your line.';
    tips[1] = 'Use deliberate torso lean shifts only when actively overtaking slower traffic.';
    tips[2] = 'Check your side mirrors mentally before moving across the carriage lanes.';
  }

  const closingLine =
    score >= 900
      ? 'A role model for urban mobility on Lahore Canal Road.'
      : 'Drive safe. Every traffic rule observed protects lives across our city.';

  return {
    headline,
    driverPersonality: personality,
    tips,
    closingLine,
  };
}
