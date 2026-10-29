import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GlassPanelProps extends HTMLMotionProps<'div'> {
  glow?: 'cyan' | 'emerald' | 'amber' | 'red' | 'none';
  children: React.ReactNode;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  glow = 'none',
  className,
  children,
  ...props
}) => {
  const glowStyles = {
    none: 'border-white/10 shadow-2xl',
    cyan: 'border-cyan-500/30 shadow-glow-cyan',
    emerald: 'border-emerald-500/30 shadow-glow-emerald',
    amber: 'border-amber-500/30 shadow-glow-amber',
    red: 'border-red-500/30 shadow-glow-red',
  };

  return (
    <motion.div
      className={cn(
        'glass-panel rounded-2xl p-6 text-slate-100',
        glowStyles[glow],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
