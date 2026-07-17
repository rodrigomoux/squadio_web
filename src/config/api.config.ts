export const apiConfig = {
  // Offline padrão: serverless-offline em http://localhost:3001
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  timeout: Number(process.env.API_TIMEOUT ?? 30_000),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
} as const;
