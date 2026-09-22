import React from 'react';

const VARIANTS = {
  indigo: 'bg-primary-500/15 text-primary-300 border-primary-500/30',
  purple: 'bg-accent-purple/20 text-purple-300 border-accent-purple/40',
  emerald: 'bg-accent-emerald/15 text-emerald-400 border-accent-emerald/30',
  amber: 'bg-accent-amber/15 text-amber-400 border-accent-amber/30',
  rose: 'bg-accent-rose/15 text-rose-400 border-accent-rose/30',
  cyan: 'bg-accent-cyan/15 text-cyan-400 border-accent-cyan/30',
  neutral: 'bg-white/5 text-text-muted border-white/10',
};

export default function Badge({ variant = 'neutral', className = '', children, ...rest }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border
        ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
