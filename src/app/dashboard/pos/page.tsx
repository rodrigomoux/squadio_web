"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { isMongoObjectId } from "@/lib/auth/objectId";
import type { Court, Product } from "@/lib/domain/types";
import { useAuth } from "@/providers/AuthProvider";
import {
  CourtsService,
  OrdersService,
  ProductsService,
} from "@/services/domain/DomainService";

type CartLine = { productId: string; name: string; unitPrice: number; quantity: number };

export default function PosPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtId, setCourtId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart],
  );

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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">PDV</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ponto de venda para consumo no balcão (pagamento imediato).
        </p>
      </div>

      <label className="block max-w-xs text-sm">
        <span className="mb-1 block text-zinc-500">Quadra</span>
        <select
          value={courtId}
          onChange={(e) => {
            setCourtId(e.target.value);
            setCart([]);
          }}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        >
          {courts.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      )}

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
                  <p className="text-zinc-500">R$ {Number(p.price).toFixed(2)}</p>
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
              <li className="text-sm text-zinc-500">Toque nos produtos para adicionar.</li>
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
    </div>
  );
}
