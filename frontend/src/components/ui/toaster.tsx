'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

let toastFn: ((type: ToastType, title: string, message?: string) => void) | null = null;

export function registerToast(fn: typeof toastFn) {
  toastFn = fn;
}

export function toast(type: ToastType, title: string, message?: string) {
  toastFn?.(type, title, message);
}

const icons = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  error: <AlertCircle className="w-4 h-4 text-red-400" />,
  info: <Info className="w-4 h-4 text-blue-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
};

const toastColors = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error: 'border-red-500/30 bg-red-500/10',
  info: 'border-blue-500/30 bg-blue-500/10',
  warning: 'border-amber-500/30 bg-amber-500/10',
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  registerToast(addToast);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border backdrop-blur-lg shadow-xl',
            'animate-in slide-in-from-right-4 fade-in duration-300',
            toastColors[t.type]
          )}
        >
          <span className="mt-0.5 flex-shrink-0">{icons[t.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t.title}</p>
            {t.message && <p className="text-xs text-muted-foreground mt-0.5">{t.message}</p>}
          </div>
          <button
            onClick={() => remove(t.id)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
