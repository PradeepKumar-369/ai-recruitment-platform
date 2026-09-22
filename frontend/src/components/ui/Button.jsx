import React from 'react';

const VARIANTS = {
  primary: 'bg-gradient-to-br from-primary-500 to-accent-purple text-white shadow-[0_4px_14px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.55)] hover:-translate-y-0.5 focus-visible:ring-primary-400',
  premium: 'bg-gradient-to-br from-purple-500 to-primary-500 text-white shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.55)] hover:-translate-y-0.5 focus-visible:ring-purple-400',
  gold: 'bg-gradient-to-br from-accent-amber to-amber-600 text-white shadow-[0_4px_14px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 focus-visible:ring-accent-amber',
  secondary: 'bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-white/20 focus-visible:ring-white/30',
  ghost: 'bg-transparent text-text-muted hover:bg-white/5 hover:text-white focus-visible:ring-white/30',
  danger: 'bg-accent-rose/10 text-rose-400 border border-accent-rose/25 hover:bg-accent-rose/20 focus-visible:ring-accent-rose',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3.5 text-base gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  children,
  as: Component = 'button',
  ...rest
}) {
  return (
    <Component
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-semibold whitespace-nowrap
        transition-all duration-200 ease-smooth cursor-pointer select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1016]
        disabled:cursor-not-allowed disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none
        ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
