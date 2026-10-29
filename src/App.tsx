import React, { useRef, useEffect, useState, useCallback } from 'react';
import { World } from './game/scene/World';
import { useGameStore, mutableGameState } from './game/store';
import { getPoseLandmarker } from './cv/poseLoader';
import { GestureEngine } from './cv/gestureEngine';
import { audioEngine } from './audio/audioEngine';
import { voiceCoach } from './audio/voiceCoach';
import { fetchCivicInsights, fetchLiveHint } from './services/insightsClient';
import { generateClientRuleBasedInsights } from './services/fallbackInsights';
import { compileRunSummary } from './game/systems/scoring';
import { clipRecorder } from './services/clipRecorder';
import { PoseLandmarker } from '@mediapipe/tasks-vision';

// Screens
import { Landing } from './components/screens/Landing';
import { HowItWorks } from './components/screens/HowItWorks';
import { Calibration } from './components/screens/Calibration';
import { LevelSelect } from './components/screens/LevelSelect';
import { Pause } from './components/screens/Pause';
import { GameOver } from './components/screens/GameOver';
import { Leaderboard } from './components/screens/Leaderboard';

// HUD Components
import { Speedometer } from './components/hud/Speedometer';
import { PointsCounter } from './components/hud/PointsCounter';
import { SignalIndicator } from './components/hud/SignalIndicator';
import { GestureChips } from './components/hud/GestureChips';
import { WebcamPiP } from './components/hud/WebcamPiP';
import { ViolationToast } from './components/hud/ViolationToast';
import { VoiceCoachBadge } from './components/hud/VoiceCoachBadge';
import { SpeedLimitSign } from './components/hud/SpeedLimitSign';
import { TelemetryGraph } from './components/hud/TelemetryGraph';
import { Loader } from './components/ui/Loader';
import { Button } from './components/ui/Button';
import { formatDistance } from './lib/utils';
import { LEVELS } from './lib/constants';

export const App: React.FC = () => {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const currentLevelIndex = useGameStore((s) => s.currentLevelIndex);
  const setCurrentLevelIndex = useGameStore((s) => s.setCurrentLevelIndex);
  const distance = useGameStore((s) => s.distance);
  const calibration = useGameStore((s) => s.calibration);
  const showcaseMode = useGameStore((s) => s.settings.showcaseMode);
  const resetRun = useGameStore((s) => s.resetRun);
  const setRunSummary = useGameStore((s) => s.setRunSummary);
  const setSubtitle = useGameStore((s) => s.setSubtitle);
  const setTrackingLost = useGameStore((s) => s.setTrackingLost);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadStep, setLoadStep] = useState('Loading 3D Simulation & Gesture Controls...');
  const [loadPercent, setLoadPercent] = useState(20);
  const [isRecordingClip, setIsRecordingClip] = useState(false);
  const [isCarStopped, setIsCarStopped] = useState(false);

  const gestureEngineRef = useRef<GestureEngine>(new GestureEngine());
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const runStartTimeRef = useRef<number>(0);

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    let mounted = true;

    const safetyTimer = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 3500);

    getPoseLandmarker((step, pct) => {
      if (mounted) {
        setLoadStep(step);
        setLoadPercent(pct);
      }
    })
      .then((instance) => {
        if (mounted) {
          landmarkerRef.current = instance;
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Vision engine initialization warning (fallback active):', err);
        if (mounted) {
          setIsLoading(false);
        }
      });

    // Voice coach subtitle listener
    voiceCoach.setSubtitleListener((sub) => {
      setSubtitle(sub);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, [setSubtitle]);

  // High-frequency gesture detection rAF loop decoupled from Three.js render
  useEffect(() => {
    let animId: number;
    let lastHintCheck = 0;

    const loop = () => {
      const landmarker = landmarkerRef.current;
      const video = videoRef.current;
      const canvas = overlayCanvasRef.current;

      if (landmarker && video) {
        const telemetry = gestureEngineRef.current.processFrame(
          landmarker,
          video,
          calibration,
          canvas
        );

        // Update mutable game state telemetry buffer
        mutableGameState.recentTelemetry = [telemetry, ...mutableGameState.recentTelemetry.slice(0, 59)];
        mutableGameState.isBraking = telemetry.isBraking;

        // Auto-pause if tracking lost > 1 second during active driving
        const isTracking = telemetry.isTracking;
        setTrackingLost(!isTracking);

        // Periodically check live hints & car stopped state
        const now = performance.now();
        if (screen === 'playing') {
          const isHalted = Math.abs(mutableGameState.carSpeed) < 3.5 && (mutableGameState.distanceTraveled > 2 || mutableGameState.isBraking);
          setIsCarStopped(isHalted);
        }

        if (screen === 'playing' && now - lastHintCheck > 15000) {
          lastHintCheck = now;
          const latestViolation = useGameStore.getState().violations[0];
          fetchLiveHint(
            latestViolation?.type,
            mutableGameState.carSpeed,
            mutableGameState.currentLane
          ).then((hint) => {
            if (hint) {
              voiceCoach.speak(hint);
            }
          });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [calibration, screen, setTrackingLost]);

  // Start Playing
  const handleStartGame = useCallback(() => {
    resetRun();
    setIsCarStopped(false);
    runStartTimeRef.current = performance.now();
    audioEngine.startEngine();
    setScreen('playing');
    voiceCoach.speak('Canal Road simulator active. Observe all traffic lights and speed limits.');
  }, [resetRun, setScreen]);

  const handleBackToMenu = useCallback(() => {
    audioEngine.stopEngine();
    setIsCarStopped(false);
    mutableGameState.isBraking = false;
    mutableGameState.carSpeed = 0;
    setScreen('landing');
  }, [setScreen]);

  const handleRestartRun = useCallback(() => {
    handleStartGame();
  }, [handleStartGame]);

  const handleResumeDrive = useCallback(() => {
    mutableGameState.isBraking = false;
    mutableGameState.carSpeed = Math.max(45, mutableGameState.carSpeed);
    setIsCarStopped(false);
    audioEngine.startEngine();
  }, []);

  const handleReverseDrive = useCallback(() => {
    mutableGameState.isBraking = false;
    mutableGameState.carSpeed = -15;
    setIsCarStopped(false);
    audioEngine.startEngine();
  }, []);

  // End Run & Generate Civic Driving Score Card immediately
  const handleEndRun = useCallback(() => {
    const timeElapsed = (performance.now() - runStartTimeRef.current) / 1000;
    const store = useGameStore.getState();

    audioEngine.stopEngine();

    const partialSummary = {
      playerName: 'Lahore Commuter',
      score: store.score,
      distanceDriven: store.distance,
      timeElapsed,
      levelReached: currentLevelIndex + 1,
      violations: store.violations,
      positiveEvents: store.positiveEvents,
    };

    // Instant local insights for zero-latency screen transition
    const immediateInsights = generateClientRuleBasedInsights(partialSummary);

    const fullSummary = compileRunSummary(
      'Lahore Commuter',
      store.score,
      store.distance,
      timeElapsed,
      currentLevelIndex + 1,
      store.violations,
      store.positiveEvents,
      immediateInsights
    );

    setRunSummary(fullSummary);
    setScreen('game-over');

    // Asynchronously fetch OpenRouter insights if configured and update seamlessly
    fetchCivicInsights(partialSummary)
      .then((liveInsights) => {
        if (liveInsights) {
          const updated = { ...useGameStore.getState().runSummary };
          if (updated && updated.date) {
            setRunSummary({
              ...updated,
              insights: liveInsights,
            } as any);
          }
        }
      })
      .catch((e) => {
        console.warn('Background insights fetch note:', e);
      });
  }, [currentLevelIndex, setRunSummary, setScreen]);

  // Global Keyboard shortcuts & end-run event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (screen === 'playing') {
          audioEngine.playClick();
          setScreen('paused');
        } else if (screen === 'paused') {
          audioEngine.playClick();
          setScreen('playing');
        } else if (screen !== 'landing') {
          audioEngine.playClick();
          handleBackToMenu();
        }
      }
    };

    const handleEndRunEvent = () => {
      handleEndRun();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('gesturekart:end-run', handleEndRunEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('gesturekart:end-run', handleEndRunEvent);
    };
  }, [screen, setScreen, handleBackToMenu, handleEndRun]);

  // Clip Recorder Toggle
  const handleToggleClip = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    if (isRecordingClip) {
      clipRecorder.stopRecording();
      setIsRecordingClip(false);
    } else {
      const started = clipRecorder.startRecording(canvas);
      if (started) {
        setIsRecordingClip(true);
        audioEngine.playSuccess();
      }
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-canvas">
      {/* Film Grain Texture Overlay */}
      <div className="grain-overlay" />

      {/* 3D WebGL World Viewport */}
      <World />

      {/* Loading Screen */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl">
          <Loader message={loadStep} progress={loadPercent} />
        </div>
      )}

      {/* Violation Alert Slide-in Toast */}
      <ViolationToast />

      {/* Voice Coach Live Subtitle Banner */}
      <VoiceCoachBadge />

      {/* Active Driving In-Game HUD */}
      {screen === 'playing' && (
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-6">
          {/* Top HUD Bar */}
          <div className="flex justify-between items-start">
            {/* Left: Sector & Distance */}
            <div className="flex items-center gap-3">
              <div className="glass-panel px-4 py-2 rounded-2xl flex flex-col">
                <span className="text-[10px] font-mono font-semibold text-cyan-400">
                  SECTOR 0{currentLevelIndex + 1}
                </span>
                <span className="font-orbitron font-bold text-sm text-white">
                  {LEVELS[currentLevelIndex]?.name || 'Canal Road'}
                </span>
                <span className="font-mono text-xs text-slate-300">
                  {formatDistance(distance)} / {LEVELS[currentLevelIndex]?.targetDistance}m
                </span>
              </div>

              <SpeedLimitSign />
            </div>

            {/* Center: Civic Points Counter & Signal Chip */}
            <div className="flex flex-col items-center gap-2">
              <div className="glass-panel px-6 py-2 rounded-2xl">
                <PointsCounter />
              </div>
              <SignalIndicator />
            </div>

            {/* Right: PiP Webcam & HUD Navigation Controls */}
            <div className="flex flex-col items-end gap-3 pointer-events-auto">
              <WebcamPiP
                videoRef={videoRef}
                overlayCanvasRef={overlayCanvasRef}
              />

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="red"
                  size="sm"
                  onClick={handleBackToMenu}
                  title="Return to Main Menu without reloading"
                >
                  ← Back
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestartRun}
                  title="Restart Run"
                >
                  🔄 Restart
                </Button>

                <Button
                  variant={isRecordingClip ? 'red' : 'ghost'}
                  size="sm"
                  onClick={handleToggleClip}
                  title="Record 30s WebM Video Clip"
                >
                  {isRecordingClip ? '🔴 REC 30s' : '📹 Clip'}
                </Button>

                <Button variant="ghost" size="sm" onClick={() => setScreen('paused')}>
                  ⏸ Pause
                </Button>

                <Button variant="outline" size="sm" onClick={handleEndRun}>
                  End Run
                </Button>
              </div>
            </div>
          </div>

          {/* Emergency Stop / Vehicle Halted Action Overlay */}
          {isCarStopped && (
            <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center gap-3 p-5 rounded-3xl glass-panel border border-red-500/50 shadow-2xl backdrop-blur-2xl bg-slate-950/90 max-w-lg text-center animate-fade-in">
              <div className="flex items-center gap-2 text-red-400 font-orbitron font-bold text-base tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                VEHICLE HALTED / EMERGENCY BRAKE
              </div>
              <p className="text-slate-300 text-xs font-mono">
                Car is currently stopped. Lower your right hand to release the brake, or choose an option below without reloading the page:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <Button variant="emerald" size="sm" onClick={handleResumeDrive}>
                  ▶ Accelerate Now
                </Button>
                <Button variant="outline" size="sm" onClick={handleReverseDrive}>
                  ⏪ Reverse Back
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRestartRun}>
                  🔄 Restart
                </Button>
                <Button variant="red" size="sm" onClick={handleBackToMenu}>
                  ← Back to Menu
                </Button>
              </div>
            </div>
          )}

          {/* Bottom HUD Bar */}
          <div className="flex justify-between items-end">
            {/* Bottom Left: Speedometer, Gear Controls & Gesture Chips */}
            <div className="flex items-end gap-4 pointer-events-auto">
              <div className="glass-panel p-2 rounded-2xl flex flex-col items-center">
                <Speedometer />
                {/* Quick Drive / Reverse Gear Switcher */}
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
                  <button
                    onClick={handleResumeDrive}
                    className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/35 border border-emerald-500/30 font-bold transition-all"
                    title="Shift into Drive (W)"
                  >
                    [D] DRIVE
                  </button>
                  <button
                    onClick={handleReverseDrive}
                    className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/35 border border-amber-500/30 font-bold transition-all"
                    title="Shift into Reverse (S)"
                  >
                    [R] REVERSE
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <GestureChips />
                {showcaseMode && <TelemetryGraph />}
              </div>
            </div>

            {/* Bottom Right: Clean drive status */}
            <div className="glass-panel px-4 py-2 rounded-2xl text-right font-mono text-xs text-slate-400">
              <span className="text-emerald-400 font-bold block">CANAL PATROL ACTIVE</span>
              <span>Raise right hand on red signals</span>
            </div>
          </div>
        </div>
      )}

      {/* Screen Router */}
      {screen === 'landing' && <Landing />}
      {screen === 'how-it-works' && <HowItWorks />}
      {screen === 'calibration' && (
        <Calibration
          videoRef={videoRef}
          overlayCanvasRef={overlayCanvasRef}
          onStartGame={() => setScreen('level-select')}
        />
      )}
      {screen === 'level-select' && (
        <LevelSelect
          onStartLevel={(idx) => {
            setCurrentLevelIndex(idx);
            handleStartGame();
          }}
        />
      )}
      {screen === 'paused' && (
        <Pause
          onResume={() => setScreen('playing')}
          onRestart={handleStartGame}
        />
      )}
      {screen === 'game-over' && (
        <GameOver
          onPlayAgain={() => setScreen('level-select')}
          onBackToMenu={handleBackToMenu}
        />
      )}
      {screen === 'leaderboard' && <Leaderboard />}
    </main>
  );
};

export default App;
