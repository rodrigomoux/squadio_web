import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

// Garante leitura dos .env desta pasta mesmo se o cwd for a raiz do monorepo
const dir = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(dir);

const jwtSecret = (
  process.env.NEXT_PUBLIC_JWT_ENCRYPTION_SECRET ||
  process.env.JWT_ENCRYPTION_SECRET ||
  ""
).trim();

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error(
    `[next.config] NEXT_PUBLIC_JWT_ENCRYPTION_SECRET deve ter ≥ 32 caracteres ` +
      `(len=${jwtSecret.length}). Verifique squadio_web/.env.local`,
  );
}

const nextConfig: NextConfig = {
  // Injeta no client, server e Edge (middleware) em build/dev
  env: {
    NEXT_PUBLIC_JWT_ENCRYPTION_SECRET: jwtSecret,
  },
};

export default nextConfig;
