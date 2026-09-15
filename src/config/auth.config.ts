export const authConfig = {
  cookies: {
    accessToken: "squadio_access_token",
    refreshToken: "squadio_refresh_token",
    apiAccessToken: "squadio_api_access_token",
    apiRefreshToken: "squadio_api_refresh_token",
  },
  token: {
    /** Sessão do painel (cookie JWE + exp do JWT). */
    accessExpiresIn: "24h",
    refreshExpiresIn: "30d",
  },
  /** maxAge dos cookies em segundos */
  cookieMaxAge: {
    access: 60 * 60 * 24, // 24h
    refresh: 60 * 60 * 24 * 30, // 30d
    apiAccess: 60 * 60 * 24, // 24h
    apiRefresh: 60 * 60 * 24 * 30, // 30d
  },
  routes: {
    login: "/login",
    dashboard: "/dashboard",
    public: [
      "/",
      "/login",
      "/forgot-password",
      "/first-access",
      "/reset-password",
    ],
  },
} as const;
