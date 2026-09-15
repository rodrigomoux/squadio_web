import { cookies } from "next/headers";

import { apiConfig } from "@/config/api.config";
import { authConfig } from "@/config/auth.config";

export type BackendResult = {
  status: number;
  body: Record<string, unknown>;
};

async function readApiTokens() {
  const store = await cookies();
  return {
    access: store.get(authConfig.cookies.apiAccessToken)?.value,
    refresh: store.get(authConfig.cookies.apiRefreshToken)?.value,
  };
}

function asBody(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string" && value.trim()) {
    return { success: false, error: value };
  }
  return { success: false, error: "Resposta vazia da API" };
}

async function rawFetch(
  path: string,
  init: RequestInit | undefined,
  accessToken?: string,
): Promise<BackendResult> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const url = `${apiConfig.baseURL.replace(/\/$/, "")}${path}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });

    const text = await response.text();
    if (!text.trim()) {
      return {
        status: response.status || 502,
        body: {
          success: false,
          error: `API retornou corpo vazio (${response.status}) em ${url}`,
        },
      };
    }

    try {
      return { status: response.status, body: asBody(JSON.parse(text)) };
    } catch {
      return {
        status: response.status || 502,
        body: {
          success: false,
          error: `Resposta não-JSON da API: ${text.slice(0, 200)}`,
        },
      };
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha de rede ao chamar a API";
    return {
      status: 502,
      body: {
        success: false,
        error: `${message}. Verifique NEXT_PUBLIC_API_URL (${apiConfig.baseURL}) e se o serverless-offline está no ar.`,
      },
    };
  }
}

/**
 * Proxy server-side para a API Squadio usando o JWT salvo nos cookies.
 */
export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<BackendResult> {
  const tokens = await readApiTokens();
  let result = await rawFetch(path, init, tokens.access);

  if (
    result.status === 401 &&
    tokens.refresh &&
    !tokens.refresh.startsWith("mock-")
  ) {
    const refreshed = await rawFetch("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: tokens.refresh }),
    });

    const data = refreshed.body.data as
      | { accessToken?: string; refreshToken?: string }
      | undefined;

    if (refreshed.status === 200 && data?.accessToken) {
      try {
        const store = await cookies();
        store.set(authConfig.cookies.apiAccessToken, data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: authConfig.cookieMaxAge.apiAccess,
        });
        if (data.refreshToken) {
          store.set(authConfig.cookies.apiRefreshToken, data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: authConfig.cookieMaxAge.apiRefresh,
          });
        }
      } catch {
        // Alguns contextos Next bloqueiam set de cookie em GET; segue com token em memória.
      }
      result = await rawFetch(path, init, data.accessToken);
    }
  }

  return result;
}
