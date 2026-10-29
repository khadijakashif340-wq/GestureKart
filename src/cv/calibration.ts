import { CalibrationData } from '@/types';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';

const CALIBRATION_STORAGE_KEY = 'gesturekart_calibration_v1';

export const DEFAULT_CALIBRATION: CalibrationData = {
  neutralLeanAngle: 0.0,
  neutralShoulderWidth: 0.25,
  minHandGap: 0.75,
  maxHandGap: 2.1,
  sensitivity: 1.0,
  isCalibrated: false,
};

export function loadStoredCalibration(): CalibrationData {
  if (typeof window === 'undefined') return DEFAULT_CALIBRATION;
  try {
    const raw = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CALIBRATION,
        ...parsed,
        neutralLeanAngle: Math.max(-3.5, Math.min(3.5, parsed.neutralLeanAngle ?? 0)),
      };
    }
  } catch (e) {
    console.warn('Failed to load stored calibration:', e);
  }
  return DEFAULT_CALIBRATION;
}

export function saveCalibration(data: CalibrationData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save calibration:', e);
  }
}

export interface CalibrationSample {
  leanAngle: number;
  shoulderWidth: number;
  handGapRatio: number;
}

export class CalibrationManager {
  private samples: CalibrationSample[] = [];
  private holdStartTime: number | null = null;
  private readonly requiredHoldDurationMs = 700; // Fast 0.7 second hold

  public reset(): void {
    this.samples = [];
    this.holdStartTime = null;
  }

  public update(
    landmarks: NormalizedLandmark[],
    now: number = performance.now()
  ): {
    hasShoulders: boolean;
    hasHands: boolean;
    progress: number;
    completed: boolean;
    result?: CalibrationData;
  } {
    const lSh = landmarks[11];
    const rSh = landmarks[12];
    const lWr = landmarks[15];
    const rWr = landmarks[16];

    // Shoulders tracked with forgiving visibility threshold
    const hasShoulders = Boolean(
      lSh && rSh && (lSh.visibility ?? 0.8) > 0.25 && (rSh.visibility ?? 0.8) > 0.25
    );

    // Hands tracked (or assumed ready if shoulders are aligned in frame)
    const hasHands = Boolean(
      (lWr && (lWr.visibility ?? 0.8) > 0.2) ||
      (rWr && (rWr.visibility ?? 0.8) > 0.2) ||
      hasShoulders
    );

    if (!hasShoulders) {
      this.holdStartTime = null;
      return {
        hasShoulders: false,
        hasHands,
        progress: 0,
        completed: false,
      };
    }

    if (this.holdStartTime === null) {
      this.holdStartTime = now;
      this.samples = [];
    }

    // Smooth shoulder tilt and lateral shift calculation for desk & seated players
    const shoulderDistX = Math.max(0.14, Math.abs(rSh.x - lSh.x));
    const shoulderSlope = (rSh.y - lSh.y) / shoulderDistX;
    const shoulderTiltDeg = Math.atan(shoulderSlope) * (180 / Math.PI);
    const shMidX = (1 - lSh.x + (1 - rSh.x)) / 2;
    const noseX = landmarks[0]?.x ?? 0.5;
    const lateralShift = ((shMidX - 0.5) / shoulderDistX) * 8.0;
    const headShift = (((1 - noseX) - shMidX) / shoulderDistX) * 6.0;
    const leanAngle = shoulderTiltDeg * 1.0 + lateralShift + headShift * 0.25;

    const shoulderWidth = Math.hypot(lSh.x - rSh.x, lSh.y - rSh.y);
    const handGap = lWr && rWr ? Math.hypot(lWr.x - rWr.x, lWr.y - rWr.y) : shoulderWidth * 1.3;
    const handGapRatio = handGap / Math.max(shoulderWidth, 0.1);

    this.samples.push({ leanAngle, shoulderWidth, handGapRatio });

    const elapsed = now - this.holdStartTime;
    const progress = Math.min(1.0, elapsed / this.requiredHoldDurationMs);

    if (progress >= 1.0 && this.samples.length >= 5) {
      const avgLean =
        this.samples.reduce((acc, s) => acc + s.leanAngle, 0) / this.samples.length;
      const avgShoulderWidth =
        this.samples.reduce((acc, s) => acc + s.shoulderWidth, 0) / this.samples.length;

      const result: CalibrationData = {
        neutralLeanAngle: Math.max(-3.5, Math.min(3.5, avgLean)),
        neutralShoulderWidth: avgShoulderWidth,
        minHandGap: 0.75,
        maxHandGap: 2.1,
        sensitivity: 1.0,
        isCalibrated: true,
      };

      saveCalibration(result);

      return {
        hasShoulders: true,
        hasHands: true,
        progress: 1.0,
        completed: true,
        result,
      };
    }

    return {
      hasShoulders: true,
      hasHands: true,
      progress,
      completed: false,
    };
  }
}
