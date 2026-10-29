import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function calculateGrade(score: number): {
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  rankTitle: string;
  rankTitleUrdu: string;
} {
  if (score >= 1050) {
    return {
      grade: 'S',
      rankTitle: 'Master of Canal Road',
      rankTitleUrdu: 'ماہر ترین ڈرائیور',
    };
  }
  if (score >= 900) {
    return {
      grade: 'A',
      rankTitle: 'Exemplary Civic Driver',
      rankTitleUrdu: 'شاندار شہری ڈرائیور',
    };
  }
  if (score >= 750) {
    return {
      grade: 'B',
      rankTitle: 'Disciplined Commuter',
      rankTitleUrdu: 'قواعد کے پابند ڈرائیور',
    };
  }
  if (score >= 600) {
    return {
      grade: 'C',
      rankTitle: 'Cautious Learner',
      rankTitleUrdu: 'ابتدائی سیکھنے والے',
    };
  }
  return {
    grade: 'D',
    rankTitle: 'Needs Road Safety Refresher',
    rankTitleUrdu: 'تربیت کی اشد ضرورت',
  };
}

export function getGradeColor(grade: 'S' | 'A' | 'B' | 'C' | 'D'): string {
  switch (grade) {
    case 'S':
      return '#10b981'; // Emerald
    case 'A':
      return '#06b6d4'; // Cyan
    case 'B':
      return '#3b82f6'; // Blue
    case 'C':
      return '#f59e0b'; // Amber
    case 'D':
      return '#ef4444'; // Red
  }
}
