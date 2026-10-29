import { PoseLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { OneEuroFilter } from './oneEuroFilter';
import { GESTURE_THRESHOLDS } from '@/lib/constants';
import { GestureTelemetry, CalibrationData } from '@/types';
import { clamp } from '@/lib/utils';

export class GestureEngine {
  private steerFilter = new OneEuroFilter(0.65, 0.004, 1.0);
  private speedFilter = new OneEuroFilter(0.8, 0.01, 1.0);

  private lastVideoTime = -1;
  private brakeStartTime: number | null = null;
  private lastTrackedTime = performance.now();

  private latestTelemetry: GestureTelemetry = {
    steer: 0,
    rawLeanAngle: 0,
    isBraking: false,
    brakeHoldProgress: 0,
    speedTarget: 50,
    rawHandGapRatio: 1.3,
    trackingConfidence: 0,
    isTracking: false,
    latencyMs: 0,
    timestamp: performance.now(),
  };

  // Keyboard override state
  private keyboardActive = false;
  private keyState = {
    left: false,
    right: false,
    brake: false,
    accelerate: false,
    decelerate: false,
  };
  private keyboardSpeed = 50;

  constructor() {
    this.setupKeyboardListeners();
  }

  private setupKeyboardListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      let handled = false;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        this.keyState.left = true;
        handled = true;
      }
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        this.keyState.right = true;
        handled = true;
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        this.keyState.brake = true;
        handled = true;
      }
      if (e.key === 'w' || e.key === 'W') {
        this.keyState.accelerate = true;
        handled = true;
      }
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        this.keyState.decelerate = true;
        handled = true;
      }

      if (handled) {
        this.keyboardActive = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        this.keyState.left = false;
      }
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        this.keyState.right = false;
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        this.keyState.brake = false;
      }
      if (e.key === 'w' || e.key === 'W') {
        this.keyState.accelerate = false;
      }
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        this.keyState.decelerate = false;
      }
    });
  }

  public processFrame(
    landmarker: PoseLandmarker,
    video: HTMLVideoElement,
    calibration: CalibrationData,
    canvasOverlay?: HTMLCanvasElement | null
  ): GestureTelemetry {
    const now = performance.now();
    const startTime = performance.now();

    // Check if new video frame is ready
    if (video.currentTime !== this.lastVideoTime && video.readyState >= 2) {
      this.lastVideoTime = video.currentTime;

      try {
        const result = landmarker.detectForVideo(video, now);

        if (result.landmarks && result.landmarks.length > 0) {
          // Track only the first / closest person
          const landmarks = result.landmarks[0];
          this.lastTrackedTime = now;
          this.computeGesturesFromLandmarks(landmarks, calibration, now);

          // Dispatch event for Calibration checklist & progress
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('gesturekart:calibration-landmarks', { detail: landmarks })
            );
          }

          if (canvasOverlay) {
            this.renderSkeleton(canvasOverlay, landmarks, video.videoWidth, video.videoHeight);
          }
        } else {
          this.handleTrackingLoss(now);
          if (canvasOverlay) {
            this.clearOverlay(canvasOverlay);
          }
        }
      } catch (err) {
        console.warn('Pose estimation frame error:', err);
        this.handleTrackingLoss(now);
      }
    } else {
      // Check for timeout if no frames received
      if (now - this.lastTrackedTime > GESTURE_THRESHOLDS.TRACKING_LOSS_TIMEOUT_MS) {
        this.latestTelemetry.isTracking = false;
        this.latestTelemetry.trackingConfidence = 0;
      }
    }

    // Merge keyboard fallback if user is pressing keys
    this.applyKeyboardFallback(now);

    this.latestTelemetry.latencyMs = Math.round(performance.now() - startTime);
    this.latestTelemetry.timestamp = now;

    return this.latestTelemetry;
  }

  private computeGesturesFromLandmarks(
    lm: NormalizedLandmark[],
    calib: CalibrationData,
    now: number
  ): void {
    // MediaPipe landmark indices
    const NOSE = 0;
    const LEFT_SHOULDER = 11;
    const RIGHT_SHOULDER = 12;
    const LEFT_HIP = 23;
    const RIGHT_HIP = 24;
    const LEFT_WRIST = 15;
    const RIGHT_WRIST = 16;

    const nose = lm[NOSE];
    const lSh = lm[LEFT_SHOULDER];
    const rSh = lm[RIGHT_SHOULDER];
    const lHip = lm[LEFT_HIP];
    const rHip = lm[RIGHT_HIP];
    const lWr = lm[LEFT_WRIST];
    const rWr = lm[RIGHT_WRIST];

    // Must have shoulders and face in frame
    if (!lSh || !rSh || !nose) {
      this.handleTrackingLoss(now);
      return;
    }

    // Compute confidence based on available upper-body points
    const upperPoints = [nose, lSh, rSh];
    const avgConfidence =
      upperPoints.reduce((acc, pt) => acc + (pt.visibility ?? 0.8), 0) / upperPoints.length;

    // --- 1. TORSO & SHOULDER LATERAL LEAN (STEERING) ---
    // Direct shoulder slope: tilting right drops right shoulder (rSh.y increases in image coords)
    const shoulderDistX = Math.max(0.14, Math.abs(rSh.x - lSh.x));
    const shoulderSlope = (rSh.y - lSh.y) / shoulderDistX;
    const shoulderTiltDeg = Math.atan(shoulderSlope) * (180 / Math.PI);

    // Shoulder center horizontal position (mirrored coords for player perspective)
    const shMidX = (1 - lSh.x + (1 - rSh.x)) / 2;
    // Gentle lateral torso displacement relative to camera center (0.5)
    const lateralShift = ((shMidX - 0.5) / shoulderDistX) * 8.0;

    // Head/nose horizontal offset relative to shoulder center
    const headShift = (((1 - nose.x) - shMidX) / shoulderDistX) * 6.0;

    // Combines shoulder tilt, physical body lateral sway, and head lean smoothly
    let rawLeanAngle = shoulderTiltDeg * 1.0 + lateralShift + headShift * 0.25;

    // Gentle blend with hips if hips happen to be visible
    if (lHip && rHip && (lHip.visibility ?? 0) > 0.4 && (rHip.visibility ?? 0) > 0.4) {
      const hipMidX = (1 - lHip.x + (1 - rHip.x)) / 2;
      const shMidY = (lSh.y + rSh.y) / 2;
      const hipMidY = (lHip.y + rHip.y) / 2;
      const hipLean = Math.atan2(shMidX - hipMidX, Math.max(hipMidY - shMidY, 0.1)) * (180 / Math.PI);
      rawLeanAngle = rawLeanAngle * 0.82 + hipLean * 0.18;
    }

    // Clamp neutral calibration to prevent any old invalid data from locking steering
    const neutralAngle = clamp(calib.neutralLeanAngle || 0, -3.0, 3.0);
    const netLean = (rawLeanAngle - neutralAngle) * (calib.sensitivity || 1.0);

    // Balanced deadzone filters out posture breathing & head wobble
    const deadzone = 2.4; // 2.4° rock-stable deadzone
    const fullLock = 15.0; // 15.0° full intentional lane lock

    let targetSteer = 0;
    if (Math.abs(netLean) > deadzone) {
      const sign = Math.sign(netLean);
      const mag = Math.min(1.0, (Math.abs(netLean) - deadzone) / (fullLock - deadzone));
      // Progressive ease-in curve: gentle micro-corrections near center, confident turn when leaning
      targetSteer = clamp(sign * Math.pow(mag, 1.55), -1.0, 1.0);
    }
    const filteredSteer = this.steerFilter.filter(targetSteer, now);

    // --- 2. RIGHT HAND RAISED (EMERGENCY BRAKE) ---
    // Right wrist (lm[16]) raised above nose / shoulder line
    const brakeThresholdY = nose.y - GESTURE_THRESHOLDS.HYSTERESIS_MARGIN_RATIO;
    const isHandRaised = Boolean(rWr && (rWr.visibility ?? 0.8) > 0.3 && rWr.y < brakeThresholdY);

    let brakeHoldProgress = 0;
    let isBraking = false;

    if (isHandRaised) {
      if (this.brakeStartTime === null) {
        this.brakeStartTime = now;
      }
      const holdTime = now - this.brakeStartTime;
      brakeHoldProgress = clamp(holdTime / GESTURE_THRESHOLDS.BRAKE_HOLD_DURATION_MS, 0, 1);
      if (holdTime >= GESTURE_THRESHOLDS.BRAKE_HOLD_DURATION_MS) {
        isBraking = true;
      }
    } else {
      this.brakeStartTime = null;
      brakeHoldProgress = 0;
      isBraking = false;
    }

    // --- 3. HAND DISTANCE (THROTTLE / SPEED CONTROL) ---
    const shoulderWidth = Math.hypot(lSh.x - rSh.x, lSh.y - rSh.y);
    let rawHandGapRatio = 1.3;
    let rawTargetSpeed = 50;

    if (lWr && rWr && (lWr.visibility ?? 0.8) > 0.25 && (rWr.visibility ?? 0.8) > 0.25) {
      const handGap = Math.hypot(lWr.x - rWr.x, lWr.y - rWr.y);
      rawHandGapRatio = handGap / Math.max(shoulderWidth, 0.15);
      const minGap = calib.minHandGap;
      const maxGap = calib.maxHandGap;
      const normalizedGap = clamp((rawHandGapRatio - minGap) / Math.max(maxGap - minGap, 0.4), 0, 1);
      rawTargetSpeed = 20 + normalizedGap * 75;
    } else {
      // Default comfortable cruise speed when hands are on wheel/desk
      rawTargetSpeed = 50;
    }

    const filteredSpeed = this.speedFilter.filter(rawTargetSpeed, now);

    this.latestTelemetry = {
      steer: filteredSteer,
      rawLeanAngle,
      isBraking,
      brakeHoldProgress,
      speedTarget: filteredSpeed,
      rawHandGapRatio,
      trackingConfidence: clamp(avgConfidence, 0, 1),
      isTracking: true,
      latencyMs: 0,
      timestamp: now,
    };
  }

  private handleTrackingLoss(now: number): void {
    if (now - this.lastTrackedTime > GESTURE_THRESHOLDS.TRACKING_LOSS_TIMEOUT_MS) {
      this.latestTelemetry.isTracking = false;
      this.latestTelemetry.trackingConfidence = 0;
      this.brakeStartTime = null;
    }
  }

  private applyKeyboardFallback(now: number): void {
    if (!this.keyboardActive) return;

    if (this.keyState.left && !this.keyState.right) {
      this.latestTelemetry.steer = -0.85;
    } else if (this.keyState.right && !this.keyState.left) {
      this.latestTelemetry.steer = 0.85;
    } else if (!this.latestTelemetry.isTracking) {
      this.latestTelemetry.steer = 0;
    }

    if (this.keyState.brake) {
      this.latestTelemetry.isBraking = true;
      this.latestTelemetry.brakeHoldProgress = 1.0;
    }

    if (this.keyState.accelerate) {
      if (this.keyboardSpeed < 10) this.keyboardSpeed = 22;
      this.keyboardSpeed = clamp(this.keyboardSpeed + 2.0, -15, 95);
      this.latestTelemetry.speedTarget = this.keyboardSpeed;
      this.latestTelemetry.isBraking = false;
    } else if (this.keyState.decelerate) {
      this.keyboardSpeed = clamp(this.keyboardSpeed - 2.5, -15, 95);
      this.latestTelemetry.speedTarget = this.keyboardSpeed;
      if (this.keyboardSpeed < 0) {
        this.latestTelemetry.isBraking = false;
      }
    }

    if (!this.latestTelemetry.isTracking) {
      this.latestTelemetry.isTracking = true;
      this.latestTelemetry.trackingConfidence = 1.0;
      this.latestTelemetry.timestamp = now;
    }
  }

  public getTelemetry(): GestureTelemetry {
    return this.latestTelemetry;
  }

  public reset(): void {
    this.steerFilter.reset();
    this.speedFilter.reset();
    this.brakeStartTime = null;
    this.keyboardActive = false;
  }

  private renderSkeleton(
    canvas: HTMLCanvasElement,
    landmarks: NormalizedLandmark[],
    srcW: number,
    srcH: number
  ): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== srcW || canvas.height !== srcH) {
      canvas.width = srcW || 320;
      canvas.height = srcH || 240;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    // Bone pairs
    const CONNECTIONS = [
      [11, 12], // Shoulders
      [11, 13], [13, 15], // Left arm
      [12, 14], [14, 16], // Right arm
      [11, 23], [12, 24], // Torso sides
      [23, 24], // Hips
    ];

    ctx.save();
    // Mirror horizontally to match mirrored camera view
    ctx.translate(w, 0);
    ctx.scale(-1, 1);

    // Draw glowing bones
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;

    for (const [i, j] of CONNECTIONS) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (p1 && p2 && (p1.visibility ?? 1) > 0.4 && (p2.visibility ?? 1) > 0.4) {
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }
    }

    // Draw joints
    const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24];
    for (const idx of JOINTS) {
      const pt = landmarks[idx];
      if (!pt || (pt.visibility ?? 1) < 0.4) continue;

      ctx.beginPath();
      const r = idx === 15 || idx === 16 ? 6 : 4;
      ctx.arc(pt.x * w, pt.y * h, r, 0, 2 * Math.PI);

      if (idx === 16 && this.latestTelemetry.isBraking) {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
      } else {
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
      }
      ctx.fill();
    }

    ctx.restore();
  }

  private clearOverlay(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}
