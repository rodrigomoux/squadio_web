import { EncryptJWT, jwtDecrypt } from "jose";

import type { TokenPayload } from "./types";

function getEncryptionKey(): Uint8Array {
  const secret = process.env.NEXT_PUBLIC_JWT_ENCRYPTION_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      "NEXT_PUBLIC_JWT_ENCRYPTION_SECRET must be defined and at least 32 characters" +
        ` (got length=${secret?.length ?? 0}). ` +
        "Defina em .env.local e reinicie o Next.js.",
    );
  }

  return new TextEncoder().encode(secret.slice(0, 32));
}

export async function encryptJwt(
  payload: TokenPayload,
  expiresIn: string,
): Promise<string> {
  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .encrypt(getEncryptionKey());
}

export async function decryptJwt(token: string): Promise<TokenPayload> {
  const { payload } = await jwtDecrypt(token, getEncryptionKey(), {
    contentEncryptionAlgorithms: ["A256GCM"],
    keyManagementAlgorithms: ["dir"],
  });

  return payload as unknown as TokenPayload;
}
