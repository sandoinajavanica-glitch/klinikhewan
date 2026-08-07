"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: CheckCircle2, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  error: { icon: XCircle, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  warning: { icon: AlertTriangle, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  info: { icon: Info, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
};

const DURATIONS = { success: 4000, info: 4500, warning: 5500, error: 6500 };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, closing: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 220);
  }, []);

  const push = useCallback((variant, message, opts = {}) => {
    const id = ++idRef.current;
    const duration = opts.duration ?? DURATIONS[variant] ?? 4500;
    setToasts((list) => [...list, { id, variant, message, duration, closing: false }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const api = useRef({
    success: (msg, opts) => push("success", msg, opts),
    error: (msg, opts) => push("error", msg, opts),
    warning: (msg, opts) => push("warning", msg, opts),
    info: (msg, opts) => push("info", msg, opts),
    dismiss,
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const v = VARIANTS[toast.variant] || VARIANTS.info;
  const Icon = v.icon;
  return (
    <div className={"toast-item" + (toast.closing ? " toast-item-out" : "")} role="status">
      <div className="toast-icon" style={{ color: v.color, background: v.bg }}>
        <Icon size={17} />
      </div>
      <div className="toast-msg">{toast.message}</div>
      <button className="toast-close" onClick={onClose} aria-label="Tutup notifikasi">
        <X size={14} />
      </button>
      {toast.duration > 0 && (
        <div
          className="toast-progress"
          style={{ background: v.color, animationDuration: `${toast.duration}ms` }}
        />
      )}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback aman kalau dipakai di luar ToastProvider (mis. saat testing).
    return { success() {}, error() {}, warning() {}, info() {}, dismiss() {} };
  }
  return ctx;
}
