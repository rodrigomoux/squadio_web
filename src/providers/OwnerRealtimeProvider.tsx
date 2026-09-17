"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

export type OwnerRealtimeEvent = {
  action: "order.created" | "reservation.created" | string;
  title: string;
  message: string;
  href: string;
  orderId?: string;
  reservationId?: string;
  courtId?: string;
  courtName?: string;
  userName?: string;
  totalAmount?: number;
  totalPrice?: number;
};

type Listener = (event: OwnerRealtimeEvent) => void;

type OwnerRealtimeContextValue = {
  subscribe: (action: string, listener: Listener) => () => void;
};

const OwnerRealtimeContext = createContext<OwnerRealtimeContextValue | null>(
  null,
);

function isOnTargetPage(pathname: string, search: string, href: string) {
  try {
    const url = new URL(href, "http://local");
    if (pathname !== url.pathname) return false;
    if (!url.search) return true;
    const current = new URLSearchParams(search);
    for (const [key, value] of url.searchParams.entries()) {
      if (current.get(key) !== value) return false;
    }
    return true;
  } catch {
    return pathname === href;
  }
}

export function OwnerRealtimeProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listenersRef = useRef(new Map<string, Set<Listener>>());
  const pathnameRef = useRef(pathname);
  const searchRef = useRef(searchParams?.toString() ?? "");

  useEffect(() => {
    pathnameRef.current = pathname;
    searchRef.current = searchParams?.toString() ?? "";
  }, [pathname, searchParams]);

  const subscribe = useCallback((action: string, listener: Listener) => {
    if (!listenersRef.current.has(action)) {
      listenersRef.current.set(action, new Set());
    }
    listenersRef.current.get(action)!.add(listener);
    return () => {
      listenersRef.current.get(action)?.delete(listener);
    };
  }, []);

  const dispatch = useCallback((event: OwnerRealtimeEvent) => {
    const set = listenersRef.current.get(event.action);
    set?.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error("[OwnerRealtime] listener error", err);
      }
    });
  }, []);

  useEffect(() => {
    if (isLoading || !user?.id) return;
    if (user.role && !["court_owner", "admin"].includes(user.role)) return;

    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL?.trim();
    if (!wsUrl) {
      console.warn("[OwnerRealtime] NEXT_PUBLIC_WEBSOCKET_URL não definida");
      return;
    }
    const baseWsUrl: string = wsUrl;

    let socket: WebSocket | null = null;
    let closed = false;
    let retryTimer: number | undefined;
    let attempt = 0;

    async function connect() {
      if (closed) return;
      try {
        const res = await fetch("/api/auth/ws-token", { credentials: "include" });
        if (!res.ok) return;
        const body = (await res.json()) as {
          data?: { token?: string };
        };
        const token = body.data?.token;
        if (!token) return;

        const url = `${baseWsUrl.replace(/\/$/, "")}?token=${encodeURIComponent(token)}`;
        socket = new WebSocket(url);

        socket.onopen = () => {
          attempt = 0;
          console.log("[OwnerRealtime] conectado");
        };

        socket.onmessage = (msg) => {
          try {
            const data = JSON.parse(String(msg.data)) as OwnerRealtimeEvent;
            if (!data?.action) return;
            dispatch(data);

            const onPage = isOnTargetPage(
              pathnameRef.current,
              searchRef.current,
              data.href || "",
            );
            if (!onPage && data.href) {
              showToast({
                title: data.title || "Nova notificação",
                message: data.message || "",
                href: data.href,
                actionLabel: "OK",
              });
            }
          } catch (err) {
            console.error("[OwnerRealtime] mensagem inválida", err);
          }
        };

        socket.onclose = () => {
          if (closed) return;
          const delay = Math.min(1000 * 2 ** attempt, 15000);
          attempt += 1;
          retryTimer = window.setTimeout(() => {
            void connect();
          }, delay);
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch (err) {
        console.error("[OwnerRealtime] connect error", err);
      }
    }

    void connect();

    return () => {
      closed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, [user?.id, user?.role, isLoading, dispatch, showToast]);

  const value = useMemo(() => ({ subscribe }), [subscribe]);

  return (
    <OwnerRealtimeContext.Provider value={value}>
      {children}
    </OwnerRealtimeContext.Provider>
  );
}

export function useOwnerRealtime(
  action: string,
  listener: Listener,
  enabled = true,
) {
  const ctx = useContext(OwnerRealtimeContext);
  useEffect(() => {
    if (!enabled || !ctx) return;
    return ctx.subscribe(action, listener);
  }, [ctx, action, listener, enabled]);
}
