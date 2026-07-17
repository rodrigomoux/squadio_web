export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  favoriteSports?: string[];
  onboardingCompleted?: boolean;
  avatarUrl?: string | null;
}

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role?: string;
  type: "access" | "refresh";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}
