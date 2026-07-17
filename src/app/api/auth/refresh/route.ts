import { NextResponse } from "next/server";

import {
  getApiRefreshTokenFromCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from "@/lib/auth/cookies";
import { decryptJwt } from "@/lib/auth/jwt";
import { AuthService } from "@/services/auth/AuthService";

export async function POST() {
  try {
    const apiRefresh = await getApiRefreshTokenFromCookies();

    if (apiRefresh && !apiRefresh.startsWith("mock-")) {
      const backend = await AuthService.refreshWithBackend(apiRefresh);
      const encrypted = await AuthService.createEncryptedTokens(backend.user);

      await setAuthCookies(encrypted.accessToken, encrypted.refreshToken, {
        accessToken: backend.accessToken,
        refreshToken: backend.refreshToken,
      });

      return NextResponse.json({ accessToken: backend.accessToken });
    }

    // Fallback: revalidar sessão local (JWE) — útil no mock de desenvolvimento
    const refreshToken = await getRefreshTokenFromCookies();
    if (!refreshToken) {
      return NextResponse.json({ message: "Sessão expirada" }, { status: 401 });
    }

    const payload = await decryptJwt(refreshToken);
    if (payload.type !== "refresh") {
      return NextResponse.json({ message: "Token inválido" }, { status: 401 });
    }

    const encrypted = await AuthService.createEncryptedTokens({
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    });

    await setAuthCookies(encrypted.accessToken, encrypted.refreshToken);

    return NextResponse.json({ accessToken: encrypted.accessToken });
  } catch {
    return NextResponse.json({ message: "Sessão expirada" }, { status: 401 });
  }
}
