"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import {
  PageHeader,
  StatusBadge,
  fieldClass,
  labelClass,
} from "@/components/ui/PageHeader";
import { isMongoObjectId } from "@/lib/auth/objectId";
import type { Court, Order } from "@/lib/domain/types";
import { useAuth } from "@/providers/AuthProvider";
import { CourtsService, OrdersService } from "@/services/domain/DomainService";

function orderTone(status: string): "success" | "warning" | "danger" | "neutral" | "info" {
  if (status === "paid") return "success";
  if (status === "pending_payment") return "warning";
  if (status === "cancelled" || status === "refunded") return "danger";
  if (status === "draft") return "neutral";
  return "info";
}

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtId, setCourtId] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    queueMicrotask(() => {
      void (async () => {
        try {
          if (user?.id && !isMongoObjectId(user.id)) {
            setError("Sessão mock. Entre com conta real.");
            setLoading(false);
            return;
          }
          const list = await CourtsService.list(
            isMongoObjectId(user?.id) ? { ownerId: user.id } : undefined,
          );
          setCourts(list);
          if (list[0]) setCourtId(list[0]._id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro");
        } finally {
          setLoading(false);
        }
      })();
    });
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!courtId) return;
    queueMicrotask(() => {
      void OrdersService.list({ courtId, mine: false })
        .then(setOrders)
        .catch((err) => setError(err instanceof Error ? err.message : "Erro"));
    });
  }, [courtId]);

  const columns: DataColumn<Order>[] = [
    {
      key: "date",
      header: "Data",
      sortable: true,
      getValue: (r) => (r.createdAt ? new Date(r.createdAt).getTime() : 0),
      render: (r) =>
        r.createdAt
          ? new Date(r.createdAt).toLocaleString("pt-BR")
          : "—",
    },
    {
      key: "id",
      header: "Pedido",
      sortable: true,
      getValue: (r) => r._id,
      render: (r) => (
        <span className="font-mono text-xs text-slate-500">
          …{r._id.slice(-6)}
        </span>
      ),
    },
    {
      key: "items",
      header: "Itens",
      sortable: true,
      getValue: (r) => r.items?.length ?? 0,
      render: (r) => r.items?.length ?? 0,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      getValue: (r) => r.status,
      render: (r) => (
        <StatusBadge label={r.status} tone={orderTone(r.status)} />
      ),
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      className: "text-right",
      getValue: (r) => r.totalAmount,
      render: (r) => (
        <span className="font-semibold tabular-nums">
          R$ {Number(r.totalAmount).toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Pedidos / vendas"
        description="Histórico de consumo e pedidos vinculados às suas quadras."
        actions={
          <Link
            href="/dashboard/pos"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            + Nova venda (PDV)
          </Link>
        }
      />

      <label className="mb-4 block max-w-xs text-sm">
        <span className={labelClass}>Quadra</span>
        <select
          value={courtId}
          onChange={(e) => setCourtId(e.target.value)}
          className={fieldClass}
        >
          {courts.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <DataTable
        rows={orders}
        columns={columns}
        getRowId={(r) => r._id}
        loading={loading}
        searchPlaceholder="Buscar por status ou ID…"
        searchKeys={[(r) => r.status, (r) => r._id]}
        emptyMessage="Nenhum pedido ainda."
      />
    </div>
  );
}
