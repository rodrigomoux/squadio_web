import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { OwnerRealtimeProvider } from "@/providers/OwnerRealtimeProvider";

import { LogoutButton } from "./logout-button";
import { SidebarNav } from "./sidebar-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f0f4f8] text-slate-900">
      <aside className="hidden w-60 shrink-0 flex-col bg-[#152238] text-white md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-tight text-white"
          >
            Squadio
          </Link>
          <p className="mt-1 text-xs text-slate-300">Painel do gestor</p>
        </div>
        <SidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 bg-[#1e3a5f] px-4 text-white shadow-md md:px-6">
          <p className="text-sm font-semibold text-white md:hidden">Squadio</p>
          <div className="ml-auto flex items-center gap-3">
            <LogoutButton />
          </div>
        </header>

        <nav className="border-b border-slate-200 bg-white px-2 md:hidden">
          <SidebarNav horizontal />
        </nav>

        <main className="flex-1 p-4 md:p-8">
          <Suspense fallback={null}>
            <OwnerRealtimeProvider>{children}</OwnerRealtimeProvider>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
