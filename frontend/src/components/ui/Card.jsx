import React from 'react';

export default function Card({ interactive = false, className = '', children, ...rest }) {
  return (
    <div
      className={`bg-bg-card backdrop-blur-xl border border-border-subtle rounded-lg shadow-md
        ${interactive ? 'transition-all duration-250 ease-smooth hover:-translate-y-0.5 hover:border-border-active hover:shadow-glow hover:bg-bg-card-hover' : ''}
        ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
