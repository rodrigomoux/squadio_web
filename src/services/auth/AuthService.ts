import { authConfig } from "@/config/auth.config";
import { encryptJwt } from "@/lib/auth/jwt";
import type {
  ApiEnvelope,
  AuthUser,
  LoginCredentials,
  LoginResponse,
  TokenPayload,
} from "@/lib/auth/types";
import { apiClient } from "@/services/api/ApiClient";
import { tokenStore } from "@/services/api/token-store";

function mapBackendUser(raw: Record<string, unknown>): AuthUser {
  return {
    id: String(raw.id),
    email: String(raw.email),
    name: String(raw.name),
    role: raw.role ? String(raw.role) : undefined,
    favoriteSports: Array.isArray(raw.favoriteSports)
      ? (raw.favoriteSports as string[])
      : undefined,
    onboardingCompleted: Boolean(raw.onboardingCompleted),
    avatarUrl: (raw.avatarUrl as string | null | undefined) ?? null,
  };
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = (await response.json()) as { message?: string };
      throw new Error(error.message ?? "Login failed");
    }

    const data = (await response.json()) as {
      user: AuthUser;
      accessToken: string;
    };

    // Token da API (JWT HS256) — usado no Bearer das chamadas ao backend
    tokenStore.set(data.accessToken);
    return data.user;
  }

  async logout(): Promise<void> {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    tokenStore.clear();
  }

  async getMe(): Promise<AuthUser> {
    const envelope = await apiClient.get<ApiEnvelope<{ user: Record<string, unknown> }>>(
      "/users/me",
    );
    return mapBackendUser(envelope.data.user);
  }

  static async createEncryptedTokens(user: AuthUser): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: "access",
    };

    const refreshPayload: TokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: "refresh",
    };

    const [accessToken, refreshToken] = await Promise.all([
      encryptJwt(accessPayload, authConfig.token.accessExpiresIn),
      encryptJwt(refreshPayload, authConfig.token.refreshExpiresIn),
    ]);

    return { accessToken, refreshToken };
  }

  static async authenticateWithBackend(
    credentials: LoginCredentials,
  ): Promise<LoginResponse> {
    try {
      const envelope = await apiClient.post<
        ApiEnvelope<{
          user: Record<string, unknown>;
          accessToken: string;
          refreshToken: string;
        }>
      >("/auth/login", credentials);

      if (!envelope?.success || !envelope.data) {
        throw new Error(envelope?.error ?? "Invalid credentials");
      }

      return {
        user: mapBackendUser(envelope.data.user),
        accessToken: envelope.data.accessToken,
        refreshToken: envelope.data.refreshToken,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const looksLikeNetwork =
        /network|ECONNREFUSED|Failed to fetch|timeout|API retornou|Falha de rede|502/i.test(
          message,
        );

      // Mock só quando a API está inacessível — não mascara 401 de credenciais reais
      if (
        process.env.NODE_ENV === "development" &&
        process.env.NEXT_PUBLIC_ALLOW_AUTH_MOCK === "true" &&
        looksLikeNetwork
      ) {
        try {
          return AuthService.mockLogin(credentials);
        } catch {
          /* fall through */
        }
      }

      throw error instanceof Error ? error : new Error("Invalid credentials");
    }
  }

  static async refreshWithBackend(refreshToken: string): Promise<LoginResponse> {
    const envelope = await apiClient.post<
      ApiEnvelope<{
        user: Record<string, unknown>;
        accessToken: string;
        refreshToken: string;
      }>
    >("/auth/refresh", { refreshToken });

    if (!envelope?.success || !envelope.data) {
      throw new Error(envelope?.error ?? "Refresh failed");
    }

    return {
      user: mapBackendUser(envelope.data.user),
      accessToken: envelope.data.accessToken,
      refreshToken: envelope.data.refreshToken,
    };
  }

  static async forgotPassword(email: string): Promise<{ message: string; resetCode?: string }> {
    const envelope = await apiClient.post<
      ApiEnvelope<{ message: string; resetCode?: string }>
    >("/auth/forgot-password", { email });

    if (!envelope?.success) {
      throw new Error(envelope?.error ?? "Falha ao solicitar recuperação");
    }

    return envelope.data;
  }

  static async resetPassword(input: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<void> {
    const envelope = await apiClient.post<ApiEnvelope<{ message: string }>>(
      "/auth/reset-password",
      input,
    );
    if (!envelope?.success) {
      throw new Error(envelope?.error ?? "Falha ao redefinir senha");
    }
  }

  private static mockLogin(credentials: LoginCredentials): LoginResponse {
    if (
      credentials.email !== "admin@squadio.com" ||
      credentials.password !== "password123"
    ) {
      throw new Error("Invalid credentials");
    }

    return {
      user: {
        id: "1",
        email: credentials.email,
        name: "Admin Squadio",
        role: "admin",
      },
      accessToken: "mock-backend-access-token",
      refreshToken: "mock-backend-refresh-token",
    };
  }
}

export const authService = new AuthService();
