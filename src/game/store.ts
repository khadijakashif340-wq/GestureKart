import { create } from 'zustand';
import {
  GameScreen,
  QualitySetting,
  ViolationRecord,
  PositiveEventRecord,
  CalibrationData,
  RunSummary,
  MutableGameState,
} from '@/types';
import { loadStoredCalibration } from '@/cv/calibration';
import { LEVELS, SCORING_RULES } from '@/lib/constants';

// Mutable singleton read in useFrame for 60 FPS zero-allocation physics
export const mutableGameState: MutableGameState = {
  carPosition: { x: 0, y: 0.15, z: 0 },
  carRotation: { x: 0, y: 0, z: 0 },
  carSpeed: 0,
  carAcceleration: 0,
  currentLane: 0,
  targetLane: 0,
  isBraking: false,
  indicatorState: 'none',
  steeringTilt: 0,
  suspensionBounce: 0,
  wheelRotation: 0,
  activeSignals: [],
  currentSpeedLimit: LEVELS[0].speedLimit,
  distanceTraveled: 0,
  collisionCooldown: 0,
  invulnerabilityTimer: 0,
  lastLaneChangeTime: 0,
  timeStraddlingLane: 0,
  recentTelemetry: [],
  activeViolationsQueue: [],
};

export interface ActiveToast {
  id: string;
  type: 'violation' | 'bonus' | 'hint';
  title: string;
  text: string;
  value?: number;
}

export interface GameSettings {
  volume: number;
  muted: boolean;
  voiceCoachEnabled: boolean;
  graphicsQuality: QualitySetting;
  sensitivity: number;
  showWebcamPreview: boolean;
  showSkeleton: boolean;
  showcaseMode: boolean;
  language: 'en' | 'ur';
}

interface GameState {
  screen: GameScreen;
  currentLevelIndex: number;
  score: number;
  combo: number;
  distance: number;
  violations: ViolationRecord[];
  positiveEvents: PositiveEventRecord[];
  settings: GameSettings;
  calibration: CalibrationData;
  runSummary: RunSummary | null;
  currentSubtitle: string;
  activeToast: ActiveToast | null;
  trackingLost: boolean;

  // Actions
  setScreen: (screen: GameScreen) => void;
  setCurrentLevelIndex: (index: number) => void;
  setScore: (score: number) => void;
  updateScore: (delta: number) => void;
  setCombo: (combo: number) => void;
  setDistance: (distance: number) => void;
  addViolation: (v: ViolationRecord) => void;
  addPositiveEvent: (e: PositiveEventRecord) => void;
  setSubtitle: (sub: string) => void;
  setActiveToast: (toast: ActiveToast | null) => void;
  setCalibration: (calib: CalibrationData) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  setRunSummary: (summary: RunSummary | null) => void;
  setTrackingLost: (lost: boolean) => void;
  resetRun: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  screen: 'landing',
  currentLevelIndex: 0,
  score: SCORING_RULES.STARTING_POINTS,
  combo: 1.0,
  distance: 0,
  violations: [],
  positiveEvents: [],
  settings: {
    volume: 0.7,
    muted: false,
    voiceCoachEnabled: true,
    graphicsQuality: 'high',
    sensitivity: 1.0,
    showWebcamPreview: true,
    showSkeleton: true,
    showcaseMode: false,
    language: 'en',
  },
  calibration: loadStoredCalibration(),
  runSummary: null,
  currentSubtitle: '',
  activeToast: null,
  trackingLost: false,

  setScreen: (screen) => set({ screen }),
  setCurrentLevelIndex: (currentLevelIndex) => {
    mutableGameState.currentSpeedLimit = LEVELS[currentLevelIndex].speedLimit;
    set({ currentLevelIndex });
  },
  setScore: (score) => set({ score: Math.max(0, score) }),
  updateScore: (delta) =>
    set((state) => ({ score: Math.max(0, state.score + delta) })),
  setCombo: (combo) => set({ combo }),
  setDistance: (distance) => set({ distance }),
  addViolation: (v) =>
    set((state) => {
      const newScore = Math.max(0, state.score - v.penalty);
      return {
        violations: [v, ...state.violations],
        score: newScore,
        combo: 1.0, // Reset clean drive combo on violation
      };
    }),
  addPositiveEvent: (e) =>
    set((state) => ({
      positiveEvents: [e, ...state.positiveEvents],
      score: state.score + e.bonus,
    })),
  setSubtitle: (currentSubtitle) => set({ currentSubtitle }),
  setActiveToast: (activeToast) => set({ activeToast }),
  setCalibration: (calibration) => set({ calibration }),
  updateSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),
  setRunSummary: (runSummary) => set({ runSummary }),
  setTrackingLost: (trackingLost) => set({ trackingLost }),
  resetRun: () => {
    mutableGameState.carPosition = { x: 0, y: 0.15, z: 0 };
    mutableGameState.carRotation = { x: 0, y: 0, z: 0 };
    mutableGameState.carSpeed = 0;
    mutableGameState.carAcceleration = 0;
    mutableGameState.currentLane = 0;
    mutableGameState.targetLane = 0;
    mutableGameState.isBraking = false;
    mutableGameState.indicatorState = 'none';
    mutableGameState.steeringTilt = 0;
    mutableGameState.suspensionBounce = 0;
    mutableGameState.wheelRotation = 0;
    mutableGameState.activeSignals = [];
    mutableGameState.currentSpeedLimit = LEVELS[0].speedLimit;
    mutableGameState.distanceTraveled = 0;
    mutableGameState.collisionCooldown = 0;
    mutableGameState.invulnerabilityTimer = 0;
    mutableGameState.lastLaneChangeTime = 0;
    mutableGameState.timeStraddlingLane = 0;
    mutableGameState.recentTelemetry = [];
    mutableGameState.activeViolationsQueue = [];

    set({
      score: SCORING_RULES.STARTING_POINTS,
      combo: 1.0,
      distance: 0,
      violations: [],
      positiveEvents: [],
      runSummary: null,
      trackingLost: false,
      activeToast: null,
      currentSubtitle: '',
    });
  },
}));
