"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

export type ToastMessage = {
  id: string;
  type: "success" | "error";
  message: string;
};

type ToastContextValue = {
  toasts: ToastMessage[];
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage["type"], message: string) => {
    const id = randomId();
    setToasts((current) => [...current, { id, type, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const showSuccess = useCallback((message: string) => addToast("success", message), [addToast]);
  const showError = useCallback((message: string) => addToast("error", message), [addToast]);

  const value = useMemo(() => ({ toasts, showSuccess, showError }), [showError, showSuccess, toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
