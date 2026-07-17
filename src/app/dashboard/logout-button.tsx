"use client";

import { useRouter } from "next/navigation";

import { authConfig } from "@/config/auth.config";
import { useAuth } from "@/providers/AuthProvider";

export function LogoutButton() {
  const router = useRouter();
  const { logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    router.push(authConfig.routes.login);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {user?.name && (
        <span className="hidden text-sm text-white/90 sm:inline">
          {user.name}
        </span>
      )}
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="rounded-lg border border-white/25 bg-white/15 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/25"
      >
        Sair
      </button>
    </div>
  );
}
