import {
  beginGlobalLoading,
  endGlobalLoading,
} from "@/lib/api/loadingStore";

export type ApiFetchOptions = {
  /** Não aciona o overlay global (ex.: polling em background). */
  silent?: boolean;
};

/**
 * fetch para o BFF com tracking de loading global.
 * Sempre envia credentials: "include" (cookies de sessão).
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: ApiFetchOptions,
): Promise<Response> {
  const silent = Boolean(options?.silent);
  if (!silent) beginGlobalLoading();
  try {
    return await fetch(input, {
      credentials: "include",
      ...init,
    });
  } finally {
    if (!silent) endGlobalLoading();
  }
}
