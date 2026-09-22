import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center gap-3 py-14 px-6 ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-white/5 border border-border-subtle flex items-center justify-center mb-1">
          <Icon size={24} className="text-text-dim" />
        </div>
      )}
      {title && <h4 className="text-white font-bold text-base m-0">{title}</h4>}
      {description && <p className="text-text-muted text-sm max-w-sm m-0 leading-relaxed">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
