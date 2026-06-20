import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toastData={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const ToastItem: React.FC<{ toastData: ToastMessage; onDismiss: () => void }> = ({ toastData, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, (toastData.duration || 4000) - 300);
    return () => clearTimeout(timer);
  }, [toastData.duration, onDismiss]);

  const config = {
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      text: "text-emerald-900 dark:text-emerald-100",
    },
    error: {
      bg: "bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800",
      icon: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
      text: "text-rose-900 dark:text-rose-100",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
      text: "text-amber-900 dark:text-amber-100",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800",
      icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />,
      text: "text-blue-900 dark:text-blue-100",
    },
  }[toastData.type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300 ${config.bg} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {config.icon}
      <p className={`text-sm font-medium flex-1 ${config.text}`}>{toastData.message}</p>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition shrink-0"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
