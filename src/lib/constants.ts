import { LevelConfig } from '@/types';

export const ROAD_CONSTANTS = {
  LANE_WIDTH: 3.6,
  TOTAL_LANES: 3,
  LANE_POSITIONS: [-3.6, 0, 3.6] as const, // Left, Center, Right
  ROAD_WIDTH: 12.0,
  CHUNK_LENGTH: 120, // Length of each road chunk
  ACTIVE_CHUNKS: 4, // Chunks spawned ahead
  CANAL_X: -12.5,
  CANAL_WIDTH: 8.0,
  CANAL_WATER_Y: -0.9,
  SIDEWALK_WIDTH: 3.5,
  TREE_SPACING: 15,
  LAMP_SPACING: 30,
};

export const SCORING_RULES = {
  STARTING_POINTS: 1000,
  RED_LIGHT_PENALTY: 150,
  PERFECT_STOP_BONUS: 50,
  CLEAN_LANE_CHANGE_BONUS: 25,
  LANE_STRADDLE_PENALTY_PER_SEC: 10,
  PEDESTRIAN_HIT_PENALTY: 200,
  COLLISION_PENALTY: 75,
  SPEEDING_PENALTY_PER_SEC: 5,
  COMBO_DISTANCE_INTERVAL: 200, // meters to increment combo
  MAX_COMBO: 3.0,
};

export const GESTURE_THRESHOLDS = {
  DEADZONE_LEAN_DEG: 4.0,
  FULL_LOCK_LEAN_DEG: 22.0,
  BRAKE_HOLD_DURATION_MS: 150,
  HYSTERESIS_MARGIN_RATIO: 0.05, // Margin above eye line for braking
  MIN_HAND_GAP_RATIO: 0.7, // Normalized to shoulder width
  MAX_HAND_GAP_RATIO: 2.1,
  TRACKING_LOSS_TIMEOUT_MS: 1000,
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Mall Road to Dharampura',
    nameUrdu: 'مال روڈ تا دھرم پورہ',
    subtitle: 'Golden Hour • Gentle Traffic',
    timeOfDay: 'golden-hour',
    targetDistance: 1200,
    speedLimit: 60,
    trafficDensity: 0.35,
    signalInterval: 28,
    fogDensity: 0.012,
    sunPosition: [80, 25, -120],
    ambientColor: '#fed7aa',
    skyColors: { top: '#1e3a8a', bottom: '#f97316' },
    ruleFocus: 'Traffic Signals & Safe Stopping Distances',
  },
  {
    id: 2,
    name: 'Dharampura to Muslim Town',
    nameUrdu: 'دھرم پورہ تا مسلم ٹاؤن',
    subtitle: 'Dusk Glow • Auto Rickshaws & Commuters',
    timeOfDay: 'dusk',
    targetDistance: 1600,
    speedLimit: 70,
    trafficDensity: 0.6,
    signalInterval: 22,
    fogDensity: 0.018,
    sunPosition: [-60, 15, -140],
    ambientColor: '#cbd5e1',
    skyColors: { top: '#0f172a', bottom: '#c026d3' },
    ruleFocus: 'Lane Discipline & Zebra Crossings',
  },
  {
    id: 3,
    name: 'Muslim Town to Thokar Niaz Baig',
    nameUrdu: 'مسلم ٹاؤن تا ٹھوکر نیاز بیگ',
    subtitle: 'Neon Night • High Speed Express Drive',
    timeOfDay: 'night',
    targetDistance: 2000,
    speedLimit: 80,
    trafficDensity: 0.85,
    signalInterval: 18,
    fogDensity: 0.022,
    sunPosition: [0, -40, -100],
    ambientColor: '#0f172a',
    skyColors: { top: '#030712', bottom: '#1e1b4b' },
    ruleFocus: 'Night Navigation & Rapid Hazard Avoidance',
  },
];

export const VEHICLE_PRESETS = [
  { type: 'rickshaw', length: 2.7, width: 1.4, height: 1.7, color: '#16a34a', speed: 42, weight: 0.3 },
  { type: 'van', length: 3.4, width: 1.5, height: 1.9, color: '#f8fafc', speed: 52, weight: 0.25 },
  { type: 'sedan', length: 4.2, width: 1.8, height: 1.4, color: '#2563eb', speed: 64, weight: 0.25 },
  { type: 'bus', length: 8.5, width: 2.5, height: 2.9, color: '#ea580c', speed: 48, weight: 0.1 },
  { type: 'bike', length: 1.9, width: 0.8, height: 1.2, color: '#dc2626', speed: 58, weight: 0.1 },
];
