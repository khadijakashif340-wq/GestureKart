import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { audioEngine } from '@/audio/audioEngine';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'emerald' | 'amber' | 'red' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    audioEngine.playClick();
    onClick?.(e);
  };

  const variants = {
    primary:
      'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 hover:bg-cyan-500/30 hover:border-cyan-300 shadow-glow-cyan',
    emerald:
      'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30 hover:border-emerald-300 shadow-glow-emerald',
    amber:
      'bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30 hover:border-amber-300 shadow-glow-amber',
    red:
      'bg-red-500/20 text-red-300 border-red-400/40 hover:bg-red-500/30 hover:border-red-300 shadow-glow-red',
    ghost:
      'bg-slate-800/40 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white',
    outline:
      'bg-transparent text-slate-200 border-white/20 hover:border-white/50 hover:bg-white/5',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm font-semibold',
    lg: 'px-7 py-3.5 text-base font-bold',
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl border backdrop-blur-md transition-colors select-none font-inter tracking-wide focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
        disabled
          ? 'opacity-40 cursor-not-allowed pointer-events-none'
          : 'cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};
