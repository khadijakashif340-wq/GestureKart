import React, { useRef, useEffect } from 'react';
import { mutableGameState } from '@/game/store';

export const TelemetryGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const telemetryList = mutableGameState.recentTelemetry;
      if (telemetryList.length < 2) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Draw Torso Lean Line (Cyan)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      telemetryList.forEach((t, i) => {
        const x = (i / (telemetryList.length - 1)) * w;
        // Steer is -1 to +1, map to h
        const y = h / 2 - t.steer * (h * 0.42);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw Speed Line (Emerald)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      telemetryList.forEach((t, i) => {
        const x = (i / (telemetryList.length - 1)) * w;
        // Speed 0 to 100, map to h
        const y = h - (t.speedTarget / 100) * (h * 0.85);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/80 p-2.5 backdrop-blur-md">
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          TORSO LEAN
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          SPEED TARGET
        </span>
      </div>
      <canvas ref={canvasRef} width={220} height={60} className="w-full h-14" />
    </div>
  );
};
