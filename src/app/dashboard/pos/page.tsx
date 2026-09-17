"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { StatusBadge } from "@/components/ui/PageHeader";
import { isMongoObjectId } from "@/lib/auth/objectId";
import type { Court, Order, Product } from "@/lib/domain/types";
import { useAuth } from "@/providers/AuthProvider";
import { useOwnerRealtime } from "@/providers/OwnerRealtimeProvider";
import {
  CourtsService,
  OrdersService,
  ProductsService,
} from "@/services/domain/DomainService";

type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

type PosTab = "balcao" | "comandas";
type ComandaFilter = "pending" | "delivered";

export default function PosPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtId, setCourtId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const initialTab =
    searchParams.get("tab") === "comandas" ? "comandas" : "balcao";
  const [tab, setTab] = useState<PosTab>(initialTab);
  const [comandaFilter, setComandaFilter] = useState<ComandaFilter>("pending");
  const [comandas, setComandas] = useState<Order[]>([]);
  const [loadingComandas, setLoadingComandas] = useState(false);
  const [togglingComandas, setTogglingComandas] = useState(false);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);

  const selectedCourt = useMemo(
    () => courts.find((c) => c._id === courtId),
    [courts, courtId],
  );
  const comandasEnabled = Boolean(selectedCourt?.comandasEnabled);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart],
  );

  const loadComandas = useCallback(async (id: string, filter: ComandaFilter) => {
    if (!id) return;
    setLoadingComandas(true);
    try {
      const list = await OrdersService.list({
        courtId: id,
        mine: false,
        status: "paid",
        source: "app",
        fulfillmentStatus: filter,
      });
      setComandas(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar comandas");
    } finally {
      setLoadingComandas(false);
    }
  }, []);

  useEffect(() => {
    const next = searchParams.get("tab") === "comandas" ? "comandas" : "balcao";
    setTab(next);
  }, [searchParams]);

  function selectTab(next: PosTab) {
    setTab(next);
    const qs = next === "comandas" ? "?tab=comandas" : "";
    router.replace(`/dashboard/pos${qs}`);
  }

  useEffect(() => {
    if (authLoading) return;
    queueMicrotask(() => {
      void (async () => {
        try {
          if (user?.id && !isMongoObjectId(user.id)) {
            setError("Sessão mock. Entre com conta real.");
            return;
          }
          const list = await CourtsService.list(
            isMongoObjectId(user?.id) ? { ownerId: user.id } : undefined,
          );
          setCourts(list);
          if (list[0]) setCourtId(list[0]._id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro");
        }
      })();
    });
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!courtId) return;
    queueMicrotask(() => {
      void ProductsService.list({ courtId })
        .then(setProducts)
        .catch((err) => setError(err instanceof Error ? err.message : "Erro"));
    });
  }, [courtId]);

  useEffect(() => {
    if (!courtId || !comandasEnabled) {
      setComandas([]);
      return;
    }
    void loadComandas(courtId, comandaFilter);
  }, [courtId, comandasEnabled, comandaFilter, loadComandas]);

  useOwnerRealtime(
    "order.created",
    useCallback(
      (event) => {
        if (!comandasEnabled || !courtId) return;
        if (event.courtId && event.courtId !== courtId) return;
        setTab("comandas");
        setComandaFilter("pending");
        router.replace("/dashboard/pos?tab=comandas");
        void loadComandas(courtId, "pending");
        setMessage(event.message || "Nova comanda recebida");
      },
      [comandasEnabled, courtId, loadComandas, router],
    ),
    Boolean(comandasEnabled && courtId),
  );

  function addProduct(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product._id);
      if (existing) {
        return prev.map((l) =>
          l.productId === product._id
            ? { ...l, quantity: l.quantity + 1 }
            : l,
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
        },
      ];
    });
  }

  async function toggleComandas(next: boolean) {
    if (!courtId) return;
    setTogglingComandas(true);
    setError(null);
    try {
      const updated = await CourtsService.update(courtId, {
        comandasEnabled: next,
      });
      setCourts((prev) =>
        prev.map((c) => (c._id === courtId ? { ...c, ...updated } : c)),
      );
      setMessage(
        next
          ? "Comandas ativadas — pedidos do app aparecerão aqui."
          : "Comandas desativadas.",
      );
      if (next) {
        selectTab("comandas");
        await loadComandas(courtId, comandaFilter);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setTogglingComandas(false);
    }
  }

  async function checkout(e: FormEvent) {
    e.preventDefault();
    if (!courtId || cart.length === 0) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const order = await OrdersService.create({
        courtId,
        items: cart.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
        })),
        payNow: true,
        source: "pos",
      });
      setCart([]);
      setMessage(
        `Venda registrada — R$ ${Number(order.totalAmount).toFixed(2)} (${order.status})`,
      );
      const refreshed = await ProductsService.list({ courtId });
      setProducts(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no PDV");
    } finally {
      setSaving(false);
    }
  }

  async function markDelivered(orderId: string) {
    setDeliveringId(orderId);
    setError(null);
    try {
      await OrdersService.markDelivered(orderId);
      setMessage("Comanda marcada como entregue.");
      await loadComandas(courtId, comandaFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entregar");
    } finally {
      setDeliveringId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">PDV</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Balcão e comandas de pedidos feitos pelo app.
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-800">Comandas do app</p>
            <p className="text-xs text-zinc-500">
              {comandasEnabled ? "Recebendo pedidos" : "Desativado"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={comandasEnabled}
            disabled={!courtId || togglingComandas}
            onClick={() => void toggleComandas(!comandasEnabled)}
            className={`relative h-7 w-12 rounded-full transition ${
              comandasEnabled ? "bg-emerald-500" : "bg-zinc-300"
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                comandasEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>

      <label className="block max-w-xs text-sm">
        <span className="mb-1 block text-zinc-500">Quadra</span>
        <select
          value={courtId}
          onChange={(e) => {
            setCourtId(e.target.value);
            setCart([]);
            setMessage(null);
          }}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        >
          {courts.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
              {c.comandasEnabled ? " · comandas on" : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => selectTab("balcao")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "balcao"
              ? "border-[#1a2332] text-[#1a2332]"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Balcão
        </button>
        <button
          type="button"
          onClick={() => selectTab("comandas")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === "comandas"
              ? "border-[#1a2332] text-[#1a2332]"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Comandas
          {comandasEnabled && comandaFilter === "pending" && comandas.length > 0
            ? ` (${comandas.length})`
            : ""}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      )}

      {tab === "balcao" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Produtos
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {products
                .filter((p) => p.active)
                .map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-4 text-left text-sm hover:border-zinc-400"
                  >
                    <p className="font-medium">{p.name}</p>
                    <p className="text-zinc-500">
                      R$ {Number(p.price).toFixed(2)}
                    </p>
                  </button>
                ))}
            </div>
          </div>

          <form
            onSubmit={checkout}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Carrinho
            </h2>
            <ul className="mt-4 space-y-2">
              {cart.length === 0 && (
                <li className="text-sm text-zinc-500">
                  Toque nos produtos para adicionar.
                </li>
              )}
              {cart.map((line) => (
                <li
                  key={line.productId}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {line.quantity}× {line.name}
                  </span>
                  <span>
                    R$ {(line.unitPrice * line.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-lg font-semibold">
              Total: R$ {total.toFixed(2)}
            </p>
            <button
              type="submit"
              disabled={saving || cart.length === 0}
              className="mt-4 w-full rounded-lg bg-[#1a2332] py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Registrando..." : "Finalizar venda (pago)"}
            </button>
          </form>
        </div>
      )}

      {tab === "comandas" && (
        <div className="space-y-4">
          {!comandasEnabled ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
              <p className="text-sm font-medium text-zinc-700">
                Ative o switch “Comandas do app” para receber pedidos.
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Com o recurso ligado, a loja da quadra fica disponível no app e
                os pedidos pagos aparecem aqui como pendentes.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setComandaFilter("pending")}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    comandaFilter === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  Pendentes
                </button>
                <button
                  type="button"
                  onClick={() => setComandaFilter("delivered")}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    comandaFilter === "delivered"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  Entregues
                </button>
                <button
                  type="button"
                  onClick={() => void loadComandas(courtId, comandaFilter)}
                  className="ml-auto rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
                >
                  Atualizar
                </button>
              </div>

              {loadingComandas && comandas.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">
                  Carregando comandas…
                </p>
              ) : comandas.length === 0 ? (
                <p className="rounded-xl border border-zinc-200 bg-white py-10 text-center text-sm text-zinc-500">
                  Nenhuma comanda{" "}
                  {comandaFilter === "pending" ? "pendente" : "entregue"}.
                </p>
              ) : (
                <ul className="space-y-3">
                  {comandas.map((order) => (
                    <li
                      key={order._id}
                      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-zinc-900">
                            {order.userName || "Jogador"}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {order.courtName || selectedCourt?.name || "Quadra"}
                            {order.createdAt
                              ? ` · ${new Date(order.createdAt).toLocaleString("pt-BR")}`
                              : ""}
                          </p>
                        </div>
                        <StatusBadge
                          label={
                            order.fulfillmentStatus === "delivered" ||
                            comandaFilter === "delivered"
                              ? "Entregue"
                              : "Pendente"
                          }
                          tone={
                            order.fulfillmentStatus === "delivered" ||
                            comandaFilter === "delivered"
                              ? "success"
                              : "warning"
                          }
                        />
                      </div>
                      <ul className="mt-3 space-y-1 text-sm text-zinc-700">
                        {order.items.map((item, idx) => (
                          <li key={`${order._id}-${idx}`}>
                            {item.quantity}× {item.name || "Produto"}
                            <span className="text-zinc-400">
                              {" "}
                              — R${" "}
                              {(item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">
                          Total R$ {Number(order.totalAmount).toFixed(2)}
                        </p>
                        {comandaFilter === "pending" && (
                          <button
                            type="button"
                            disabled={deliveringId === order._id}
                            onClick={() => void markDelivered(order._id)}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {deliveringId === order._id
                              ? "Salvando…"
                              : "Marcar entregue"}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
