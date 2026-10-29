import React, { useState, useEffect } from 'react';
import { useGameStore, mutableGameState } from '@/game/store';
import { cameraManager } from '@/cv/cameraManager';

export const WebcamPiP: React.FC<{
  videoRef: React.RefObject<HTMLVideoElement>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
}> = ({ videoRef, overlayCanvasRef }) => {
  const showWebcam = useGameStore((s) => s.settings.showWebcamPreview);
  const showSkeleton = useGameStore((s) => s.settings.showSkeleton);
  const trackingLost = useGameStore((s) => s.trackingLost);
  const [minimized, setMinimized] = useState(false);
  const [steerTilt, setSteerTilt] = useState(0);

  // Monitor steering tilt for real-time visual feedback on webcam
  useEffect(() => {
    const interval = setInterval(() => {
      setSteerTilt(mutableGameState.steeringTilt);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Automatically attach persistent webcam stream when PiP mounts
  useEffect(() => {
    if (videoRef.current) {
      cameraManager.attachToVideo(videoRef.current);
    }
  }, [videoRef]);

  if (!showWebcam) return null;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden backdrop-blur-md bg-slate-950/80 transition-all duration-300 ${
        trackingLost ? 'border-2 border-red-500/80 shadow-glow-red' : 'border border-cyan-500/30 shadow-2xl'
      } ${minimized ? 'w-24 h-16' : 'w-56 h-40'}`}
    >
      {/* Video element - mirrored horizontally with scaleX(-1) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform -scale-x-100 opacity-90"
      />

      {/* Glowing Skeleton Canvas Overlay */}
      {showSkeleton && (
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}

      {/* Top Header: Tracking Status Indicator & Live Lean Pill */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 border border-white/10 text-[10px] font-mono">
          <div
            className={`w-2 h-2 rounded-full ${
              trackingLost ? 'bg-red-500 animate-ping' : 'bg-emerald-400 shadow-glow-emerald'
            }`}
          />
          <span className={trackingLost ? 'text-red-400 font-bold' : 'text-emerald-300 font-bold'}>
            {trackingLost ? 'LOST' : 'TRACKING'}
          </span>
        </div>

        {/* Live Shoulder Steer Pill */}
        {!minimized && !trackingLost && Math.abs(steerTilt) > 0.15 && (
          <div className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/60 text-[10px] font-mono font-bold text-cyan-300 animate-pulse">
            {steerTilt < -0.15 ? '◀ LEFT' : 'RIGHT ▶'}
          </div>
        )}
      </div>

      {/* Minimize Toggle */}
      <button
        onClick={() => setMinimized(!minimized)}
        className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs z-10 cursor-pointer"
        title={minimized ? 'Maximize' : 'Minimize'}
      >
        {minimized ? '□' : '−'}
      </button>

      {/* Non-blocking Tracking Status Banner at bottom (Keeps video fully visible!) */}
      {trackingLost && !minimized && (
        <div className="absolute bottom-2 inset-x-2 bg-red-950/85 backdrop-blur-md border border-red-500/60 rounded-xl py-1 px-2 flex items-center justify-center gap-1.5 text-center pointer-events-none z-10">
          <span className="text-xs">⚠️</span>
          <span className="text-[10px] font-mono font-semibold text-red-200">
            Center in frame • Keyboard active
          </span>
        </div>
      )}
    </div>
  );
};
