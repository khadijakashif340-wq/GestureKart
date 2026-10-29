import html2canvas from 'html2canvas';
import { RunSummary } from '@/types';
import { getGradeColor } from '@/lib/utils';

export async function generatePngReport(summary: RunSummary): Promise<void> {
  const element = document.getElementById('report-card-print-target');

  if (element) {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a',
      });

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `GestureKart-ScoreCard-${summary.playerName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    } catch (e) {
      console.warn('html2canvas image generation failed, falling back to canvas draw:', e);
    }
  }

  // Canvas programmatic fallback
  generateSocialShareCard(summary);
}

export function generateSocialShareCard(summary: RunSummary): void {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 1200, 630);
  grad.addColorStop(0, '#06080e');
  grad.addColorStop(0.5, '#0a0d14');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 630);

  // Border glow
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#06b6d4';
  ctx.strokeRect(20, 20, 1160, 590);

  // Logo
  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 54px Orbitron, sans-serif';
  ctx.fillText('GESTUREKART', 70, 110);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '22px Inter, sans-serif';
  ctx.fillText('Physical Gesture 3D Traffic Simulator • Lahore Canal Road', 70, 155);

  // Driver details
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Inter, sans-serif';
  ctx.fillText(summary.playerName, 70, 260);

  ctx.fillStyle = '#10b981';
  ctx.font = '24px Inter, sans-serif';
  ctx.fillText(summary.rankTitle, 70, 305);

  // Stats boxes
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(70, 360, 180, 110);
  ctx.fillRect(280, 360, 180, 110);
  ctx.fillRect(490, 360, 180, 110);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText('DISTANCE', 90, 395);
  ctx.fillText('REACTION', 300, 395);
  ctx.fillText('ACCURACY', 510, 395);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Orbitron, sans-serif';
  ctx.fillText(`${summary.distanceDriven}m`, 90, 440);
  ctx.fillText(`${summary.avgReactionTimeMs}ms`, 300, 440);
  ctx.fillText(`${summary.breakdown.signalObedience}%`, 510, 440);

  // Score Badge
  const gradeColor = getGradeColor(summary.grade);
  ctx.fillStyle = 'rgba(10, 13, 20, 0.9)';
  ctx.fillRect(780, 210, 340, 260);
  ctx.strokeStyle = gradeColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(780, 210, 340, 260);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px Inter, sans-serif';
  ctx.fillText('CIVIC DRIVING SCORE', 850, 260);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 84px Orbitron, sans-serif';
  ctx.fillText(`${summary.score}`, 850, 360);

  ctx.fillStyle = gradeColor;
  ctx.font = 'bold 42px Orbitron, sans-serif';
  ctx.fillText(`GRADE ${summary.grade}`, 850, 430);

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '18px Inter, sans-serif';
  ctx.fillText('Drive safe. Every rule saves a life. • gesturekart.vercel.app', 70, 560);

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `GestureKart-ShareCard-${summary.playerName.replace(/\s+/g, '_')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
