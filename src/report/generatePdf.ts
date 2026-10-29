import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { RunSummary } from '@/types';

export async function generatePdfReport(summary: RunSummary): Promise<void> {
  const element = document.getElementById('report-card-print-target');

  if (element) {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 mm
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(pageHeight, imgHeight));
      pdf.save(`GestureKart-ScoreCard-${summary.playerName.replace(/\s+/g, '_')}.pdf`);
      return;
    } catch (e) {
      console.warn('html2canvas rendering fallback to direct jsPDF:', e);
    }
  }

  // Direct jsPDF generation fallback
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setTextColor(6, 182, 212);
  doc.setFontSize(22);
  doc.text('GESTUREKART: CIVIC DRIVING REPORT', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(`Driver: ${summary.playerName} • Date: ${summary.date}`, 14, 28);
  doc.text(`Score: ${summary.score} | Grade: ${summary.grade} (${summary.rankTitle})`, 14, 34);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('Category Performance:', 14, 46);
  doc.setFontSize(10);
  doc.text(`- Signal Obedience: ${summary.breakdown.signalObedience}%`, 14, 54);
  doc.text(`- Lane Discipline: ${summary.breakdown.laneDiscipline}%`, 14, 60);
  doc.text(`- Pedestrian Safety: ${summary.breakdown.pedestrianSafety}%`, 14, 66);
  doc.text(`- Speed Control: ${summary.breakdown.speedControl}%`, 14, 72);

  doc.setFontSize(12);
  doc.text('Civic Insights & Driving Analysis:', 14, 84);
  doc.setFontSize(10);
  doc.text(`"${summary.insights.headline}"`, 14, 92);
  summary.insights.tips.forEach((tip, idx) => {
    doc.text(`• ${tip}`, 14, 100 + idx * 7);
  });

  doc.text('Drive safe. Every rule saves a life.', 14, 280);
  doc.save(`GestureKart-ScoreCard-${summary.playerName.replace(/\s+/g, '_')}.pdf`);
}
