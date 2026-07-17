import { redirect } from "next/navigation";

import { authConfig } from "@/config/auth.config";
import { backendFetch } from "@/lib/api/backend";
import { getSession } from "@/lib/auth/session";

type OwnerMetrics = {
  reservationsToday: number;
  occupancyPercent: number;
  monthRevenue: number;
  courtsCount: number;
  currency: string;
};

function formatMoney(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect(authConfig.routes.login);
  }

  const result = await backendFetch("/analytics/owner");
  const metrics = (
    result.body.data as { metrics?: OwnerMetrics } | undefined
  )?.metrics;

  const cards = [
    {
      label: "Reservas hoje",
      value: metrics != null ? String(metrics.reservationsToday) : "—",
      hint: metrics != null ? `${metrics.courtsCount} quadra(s)` : undefined,
    },
    {
      label: "Ocupação",
      value: metrics != null ? `${metrics.occupancyPercent}%` : "—",
      hint: "Com base no horário de abertura de hoje",
    },
    {
      label: "Receita (mês)",
      value:
        metrics != null
          ? formatMoney(metrics.monthRevenue, metrics.currency)
          : "—",
      hint: "Reservas + pedidos pagos",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Olá, {user.name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Resumo operacional das suas quadras.
        </p>
      </div>

      {result.status !== 200 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Não foi possível carregar métricas
          {typeof result.body.error === "string"
            ? `: ${result.body.error}`
            : ". Verifique se a API está no ar."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {card.value}
            </p>
            {card.hint && (
              <p className="mt-2 text-xs text-slate-500">{card.hint}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
