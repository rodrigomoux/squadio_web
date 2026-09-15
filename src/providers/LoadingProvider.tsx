"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { GlobalLoadingOverlay } from "@/components/ui/GlobalLoadingOverlay";
import { subscribeGlobalLoading } from "@/lib/api/loadingStore";

type LoadingContextValue = {
  pending: number;
  isLoading: boolean;
};

const LoadingContext = createContext<LoadingContextValue>({
  pending: 0,
  isLoading: false,
});

const SHOW_DELAY_MS = 120;

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeGlobalLoading(setPending), []);

  useEffect(() => {
    if (pending <= 0) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pending]);

  const value = useMemo(
    () => ({ pending, isLoading: pending > 0 }),
    [pending],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoadingOverlay open={visible} />
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  return useContext(LoadingContext);
}
