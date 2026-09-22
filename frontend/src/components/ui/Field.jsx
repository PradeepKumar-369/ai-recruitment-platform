import React from 'react';

const fieldBase = `w-full bg-slate-900/80 border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-text-main
  placeholder:text-text-dim transition-all duration-200 ease-smooth
  focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25`;

export function Label({ children, className = '' }) {
  return <label className={`block text-xs font-semibold text-slate-300 mb-1.5 ${className}`}>{children}</label>;
}

export function TextInput({ className = '', ...rest }) {
  return <input className={`${fieldBase} ${className}`} {...rest} />;
}

export function TextArea({ className = '', ...rest }) {
  return <textarea className={`${fieldBase} resize-none ${className}`} {...rest} />;
}

export function Select({ className = '', children, ...rest }) {
  return (
    <select className={`${fieldBase} ${className}`} {...rest}>
      {children}
    </select>
  );
}
