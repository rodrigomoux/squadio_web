"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type ToastItem = {
  id: string;
  title: string;
  message: string;
  href?: string;
  actionLabel?: string;
};

type ToastContextValue = {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const router = useRouter();

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
            role="status"
          >
            <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
            <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
            <div className="mt-3 flex justify-end gap-2">
              {toast.href ? (
                <button
                  type="button"
                  className="rounded-lg bg-[#1a2332] px-3 py-1.5 text-sm font-medium text-white"
                  onClick={() => {
                    dismissToast(toast.id);
                    router.push(toast.href!);
                  }}
                >
                  {toast.actionLabel || "OK"}
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700"
                  onClick={() => dismissToast(toast.id)}
                >
                  {toast.actionLabel || "OK"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
