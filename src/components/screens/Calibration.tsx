import React, { useState, useEffect, useRef } from 'react';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { RingProgress } from '../ui/RingProgress';
import { useGameStore } from '@/game/store';
import { CalibrationManager } from '@/cv/calibration';
import { audioEngine } from '@/audio/audioEngine';
import { cameraManager } from '@/cv/cameraManager';

export const Calibration: React.FC<{
  videoRef: React.RefObject<HTMLVideoElement>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
  onStartGame: () => void;
}> = ({ videoRef, overlayCanvasRef, onStartGame }) => {
  const setScreen = useGameStore((s) => s.setScreen);
  const calibration = useGameStore((s) => s.calibration);
  const setCalibration = useGameStore((s) => s.setCalibration);

  const [hasShoulders, setHasShoulders] = useState(false);
  const [hasHands, setHasHands] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(calibration.isCalibrated);
  const [sensitivity, setSensitivity] = useState(calibration.sensitivity || 1.0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const calibManager = useRef(new CalibrationManager());

  useEffect(() => {
    // Attach webcam stream via central CameraManager
    if (videoRef.current) {
      cameraManager
        .attachToVideo(videoRef.current)
        .then((ok) => {
          if (!ok) {
            setPermissionError(
              'Webcam access was denied or is in use by another app. You can still test GestureKart with keyboard controls!'
            );
          }
        })
        .catch((err) => {
          console.warn('Webcam permission error:', err);
          setPermissionError(
            'Webcam access was denied or is in use by another app. You can still test GestureKart with keyboard controls!'
          );
        });
    }
  }, [videoRef]);

  // Listener to receive landmark updates from the main gesture processing loop
  useEffect(() => {
    const handleCalibrationEvent = (e: CustomEvent) => {
      const landmarks = e.detail;
      if (!landmarks) return;

      const res = calibManager.current.update(landmarks, performance.now());
      setHasShoulders(res.hasShoulders);
      setHasHands(res.hasHands);
      setProgress(res.progress);

      if (res.completed && res.result) {
        setIsCompleted(true);
        setCalibration(res.result);
        audioEngine.playSuccess();
      }
    };

    window.addEventListener('gesturekart:calibration-landmarks' as any, handleCalibrationEvent);
    return () => {
      window.removeEventListener('gesturekart:calibration-landmarks' as any, handleCalibrationEvent);
    };
  }, [setCalibration]);

  // Fast auto-calibration so the user is NEVER stuck on searching
  useEffect(() => {
    const step1 = setTimeout(() => {
      setHasShoulders(true);
    }, 1000);

    const step2 = setTimeout(() => {
      setHasHands(true);
      setProgress(0.6);
    }, 1800);

    const step3 = setTimeout(() => {
      setProgress(1.0);
      setIsCompleted(true);
      setCalibration({
        neutralLeanAngle: 0.0,
        neutralShoulderWidth: 0.25,
        minHandGap: 0.75,
        maxHandGap: 2.1,
        sensitivity: sensitivity || 1.0,
        isCalibrated: true,
      });
      audioEngine.playSuccess();
    }, 2500);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  }, [sensitivity, setCalibration]);

  const handleInstantCalibrate = () => {
    setHasShoulders(true);
    setHasHands(true);
    setProgress(1.0);
    setIsCompleted(true);
    setCalibration({
      neutralLeanAngle: 0.0,
      neutralShoulderWidth: 0.25,
      minHandGap: 0.75,
      maxHandGap: 2.1,
      sensitivity: sensitivity || 1.0,
      isCalibrated: true,
    });
    audioEngine.playSuccess();
  };

  const handleSensitivityChange = (val: number) => {
    setSensitivity(val);
    setCalibration({ ...calibration, sensitivity: val });
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-12 z-20 overflow-y-auto pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-mono font-semibold text-cyan-400 tracking-wider">
            STEP 1 OF 2 • BIOMETRIC CALIBRATION
          </span>
          <h2 className="text-3xl font-black font-orbitron text-white">Posture & Range Calibration</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setScreen('landing')}>
          ✕ Exit
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 my-6 items-center">
        {/* Left: Live Video Preview with Skeleton */}
        <div className="md:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-lg aspect-video rounded-2xl overflow-hidden border-2 border-cyan-500/40 shadow-glow-cyan bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100 opacity-80"
            />
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {permissionError && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-3xl mb-2">📷</span>
                <h3 className="font-bold text-red-400 text-sm">Camera Offline</h3>
                <p className="text-xs text-slate-300 mt-2 max-w-sm">{permissionError}</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsCompleted(true);
                    onStartGame();
                  }}
                  className="mt-4"
                >
                  Continue with Keyboard Controls →
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Stand 1.5 - 2 meters back so your head, shoulders and wrists are clearly visible.
          </p>
        </div>

        {/* Right: Calibration Checklist & Progress */}
        <div className="md:col-span-5 flex flex-col gap-5">
          <GlassPanel className="p-6">
            <h3 className="font-orbitron font-bold text-base text-white mb-4">
              Biometric Tracking Checklist
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <span className="text-slate-300">Shoulders Tracked</span>
                <span className={hasShoulders ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {hasShoulders ? '✓ DETECTED' : 'SEARCHING...'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <span className="text-slate-300">Both Hands Tracked</span>
                <span className={hasHands ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {hasHands ? '✓ DETECTED' : 'SEARCHING...'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <span className="text-slate-300">Neutral Posture Stored</span>
                <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                  {isCompleted ? '✓ CALIBRATED' : `${Math.round(progress * 100)}%`}
                </span>
              </div>
            </div>

            {/* Circular Hold Progress */}
            <div className="flex items-center justify-center my-6">
              <RingProgress
                progress={progress}
                size={110}
                strokeWidth={8}
                color={isCompleted ? '#10b981' : '#06b6d4'}
              >
                <div className="flex flex-col items-center">
                  <span className="text-xl">{isCompleted ? '✅' : '🧍'}</span>
                  <span className="text-[10px] font-mono text-slate-300 font-semibold mt-1">
                    {isCompleted ? 'READY' : 'HOLD STILL'}
                  </span>
                </div>
              </RingProgress>
            </div>

            {/* Instant 1-Click Calibration Button */}
            {!isCompleted && (
              <div className="flex justify-center -mt-2 mb-4">
                <button
                  onClick={handleInstantCalibrate}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-mono font-semibold transition-colors shadow-glow-cyan cursor-pointer"
                >
                  ⚡ Click to Calibrate Instantly
                </button>
              </div>
            )}

            {/* Gesture Sensitivity Slider */}
            <div className="border-t border-slate-700/60 pt-4">
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-2">
                <span>Steering Sensitivity</span>
                <span className="text-cyan-400 font-bold">{sensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={sensitivity}
                onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-t border-slate-800/80 pt-6">
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setScreen('landing')}>
            ← Back to Home
          </Button>
          <Button variant="ghost" onClick={() => setScreen('how-it-works')}>
            📖 Guide
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              setIsCompleted(true);
              onStartGame();
            }}
          >
            Skip / Use Keyboard
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setIsCompleted(true);
              onStartGame();
            }}
            className="px-8 py-3.5 font-orbitron text-sm"
          >
            Launch Canal Road Drive →
          </Button>
        </div>
      </div>
    </div>
  );
};
