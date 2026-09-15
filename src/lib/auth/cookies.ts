import { cookies } from "next/headers";

import { authConfig } from "@/config/auth.config";

import { decryptJwt } from "./jwt";
import type { TokenPayload } from "./types";

const secureCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  apiTokens?: { accessToken: string; refreshToken: string },
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(authConfig.cookies.accessToken, accessToken, {
    ...secureCookieOptions,
    maxAge: authConfig.cookieMaxAge.access,
  });

  cookieStore.set(authConfig.cookies.refreshToken, refreshToken, {
    ...secureCookieOptions,
    maxAge: authConfig.cookieMaxAge.refresh,
  });

  if (apiTokens) {
    cookieStore.set(authConfig.cookies.apiAccessToken, apiTokens.accessToken, {
      ...secureCookieOptions,
      maxAge: authConfig.cookieMaxAge.apiAccess,
    });
    cookieStore.set(authConfig.cookies.apiRefreshToken, apiTokens.refreshToken, {
      ...secureCookieOptions,
      maxAge: authConfig.cookieMaxAge.apiRefresh,
    });
  }
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(authConfig.cookies.accessToken);
  cookieStore.delete(authConfig.cookies.refreshToken);
  cookieStore.delete(authConfig.cookies.apiAccessToken);
  cookieStore.delete(authConfig.cookies.apiRefreshToken);
}

export async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(authConfig.cookies.accessToken)?.value ?? null;
}

export async function getRefreshTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(authConfig.cookies.refreshToken)?.value ?? null;
}

export async function getApiRefreshTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(authConfig.cookies.apiRefreshToken)?.value ?? null;
}

export async function getAccessPayloadFromCookies(): Promise<TokenPayload | null> {
  const token = await getAccessTokenFromCookies();

  if (!token) {
    return null;
  }

  try {
    const payload = await decryptJwt(token);

    if (payload.type !== "access") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
