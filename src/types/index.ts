export type GameScreen =
  | 'landing'
  | 'how-it-works'
  | 'calibration'
  | 'level-select'
  | 'playing'
  | 'paused'
  | 'game-over'
  | 'leaderboard';

export type QualitySetting = 'low' | 'medium' | 'high';
export type TimeOfDay = 'golden-hour' | 'dusk' | 'night';

export interface LevelConfig {
  id: number;
  name: string;
  nameUrdu: string;
  subtitle: string;
  timeOfDay: TimeOfDay;
  targetDistance: number; // in meters
  speedLimit: number; // km/h
  trafficDensity: number; // 0.0 - 1.0
  signalInterval: number; // seconds between intersections
  fogDensity: number;
  sunPosition: [number, number, number];
  ambientColor: string;
  skyColors: { top: string; bottom: string };
  ruleFocus: string;
}

export type SignalColor = 'green' | 'yellow' | 'red';

export interface SignalState {
  id: string;
  z: number;
  color: SignalColor;
  timeInState: number;
  stopLineZ: number;
  passed: boolean;
  violated: boolean;
  perfectStopAwarded: boolean;
}

export type ViolationType =
  | 'red-light'
  | 'failed-yield'
  | 'lane-straddle'
  | 'speeding'
  | 'collision';

export interface ViolationRecord {
  id: string;
  type: ViolationType;
  title: string;
  description: string;
  penalty: number;
  timestamp: number; // seconds into run
  distance: number; // meters into run
  speedAtEvent: number;
  ruleReference: string;
}

export interface PositiveEventRecord {
  id: string;
  title: string;
  bonus: number;
  timestamp: number;
  distance: number;
  reactionTimeMs?: number;
  scoreOutOf100?: number;
}

export interface GestureTelemetry {
  steer: number; // -1 (left) to +1 (right)
  rawLeanAngle: number;
  isBraking: boolean;
  brakeHoldProgress: number; // 0.0 to 1.0
  speedTarget: number; // 0 to 100 km/h
  rawHandGapRatio: number;
  trackingConfidence: number; // 0.0 to 1.0
  isTracking: boolean;
  latencyMs: number;
  timestamp: number;
}

export interface CalibrationData {
  neutralLeanAngle: number;
  neutralShoulderWidth: number;
  minHandGap: number;
  maxHandGap: number;
  sensitivity: number; // 0.5 to 2.0 (default 1.0)
  isCalibrated: boolean;
}

export interface CivicInsightsData {
  headline: string;
  driverPersonality: string;
  tips: [string, string, string];
  closingLine: string;
  isFallback?: boolean;
}

export interface CategoryBreakdown {
  signalObedience: number; // 0-100
  laneDiscipline: number; // 0-100
  pedestrianSafety: number; // 0-100
  speedControl: number; // 0-100
}

export interface RunSummary {
  playerName: string;
  date: string;
  score: number;
  startingPoints: number;
  bonusPoints: number;
  penalties: number;
  distanceDriven: number;
  timeElapsed: number;
  topSpeed: number;
  averageSpeed: number;
  levelReached: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  rankTitle: string;
  breakdown: CategoryBreakdown;
  violations: ViolationRecord[];
  positiveEvents: PositiveEventRecord[];
  insights: CivicInsightsData;
  avgReactionTimeMs: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  grade: string;
  date: string;
  level: number;
}

// Low-latency mutable game state read in useFrame to prevent React re-renders
export interface MutableGameState {
  carPosition: { x: number; y: number; z: number };
  carRotation: { x: number; y: number; z: number };
  carSpeed: number; // km/h
  carAcceleration: number;
  currentLane: number; // -1 (left), 0 (center), 1 (right)
  targetLane: number;
  isBraking: boolean;
  indicatorState: 'none' | 'left' | 'right';
  steeringTilt: number;
  suspensionBounce: number;
  wheelRotation: number;
  activeSignals: SignalState[];
  currentSpeedLimit: number;
  distanceTraveled: number;
  collisionCooldown: number;
  invulnerabilityTimer: number;
  lastLaneChangeTime: number;
  timeStraddlingLane: number;
  recentTelemetry: GestureTelemetry[];
  activeViolationsQueue: ViolationRecord[];
}
