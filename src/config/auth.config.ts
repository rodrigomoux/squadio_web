export const authConfig = {
  cookies: {
    accessToken: "squadio_access_token",
    refreshToken: "squadio_refresh_token",
    apiAccessToken: "squadio_api_access_token",
    apiRefreshToken: "squadio_api_refresh_token",
  },
  token: {
    accessExpiresIn: "15m",
    refreshExpiresIn: "7d",
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
