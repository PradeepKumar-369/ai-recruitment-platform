import React, { createContext, useState, useContext, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const borderColor = {
    success: 'border-l-emerald-500',
    error: 'border-l-accent-rose',
    info: 'border-l-primary-500',
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto flex flex-col gap-3 z-[9999] sm:max-w-[380px] sm:w-[calc(100%-3rem)]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-slate-800 shadow-[0_10px_25px_rgba(0,0,0,0.5)] border border-white/10 border-l-4 ${borderColor[toast.type] || borderColor.info}
              rounded-lg px-4 py-3.5 flex items-center justify-between gap-3 backdrop-blur-xl animate-fade-in`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {toast.type === 'success' && <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />}
              {toast.type === 'error' && <AlertCircle size={20} className="text-accent-rose shrink-0" />}
              {toast.type === 'info' && <Info size={20} className="text-primary-400 shrink-0" />}
              <span className="text-sm text-text-main font-medium break-words">
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 flex items-center justify-center p-0.5 rounded cursor-pointer text-text-muted hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
