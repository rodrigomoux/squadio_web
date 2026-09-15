"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/providers/AuthProvider";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/establishments", label: "Localidades" },
  { href: "/dashboard/courts", label: "Quadras" },
  { href: "/dashboard/reservations", label: "Reservas" },
  { href: "/dashboard/products", label: "Produtos" },
  { href: "/dashboard/pos", label: "PDV" },
  { href: "/dashboard/orders", label: "Pedidos" },
  { href: "/dashboard/championships", label: "Campeonatos" },
];

const adminNav = [
  { href: "/dashboard/system-config", label: "Configurações" },
];

export function SidebarNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const items =
    user?.role === "admin" ? [...nav, ...adminNav] : nav;

  if (horizontal) {
    return (
      <div className="flex gap-1 overflow-x-auto py-2">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-3">
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-white/15 text-white"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
