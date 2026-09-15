import { getAccessPayloadFromCookies } from "./cookies";
import type { AuthUser } from "./types";

export async function getSession(): Promise<AuthUser | null> {
  const payload = await getAccessPayloadFromCookies();

  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
}
