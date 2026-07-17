"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import {
  CreateButton,
  PageHeader,
  StatusBadge,
  fieldClass,
  labelClass,
} from "@/components/ui/PageHeader";
import { isMongoObjectId } from "@/lib/auth/objectId";
import type { Court, Product } from "@/lib/domain/types";
import { useAuth } from "@/providers/AuthProvider";
import { CourtsService, ProductsService } from "@/services/domain/DomainService";

type ProductFormState = {
  name: string;
  price: string;
  stock: string;
  description: string;
};

const emptyForm: ProductFormState = {
  name: "",
  price: "10",
  stock: "",
  description: "",
};

export default function ProductsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtId, setCourtId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  async function loadCourts() {
    if (user?.id && !isMongoObjectId(user.id)) {
      setError("Sessão mock. Entre com conta real de gestor.");
      setLoading(false);
      return;
    }
    const list = await CourtsService.list(
      isMongoObjectId(user?.id) ? { ownerId: user.id } : undefined,
    );
    setCourts(list);
    if (list[0] && !courtId) setCourtId(list[0]._id);
  }

  async function loadProducts(id: string) {
    if (!id) return;
    const list = await ProductsService.list({ courtId: id, all: true });
    setProducts(list);
  }

  useEffect(() => {
    if (authLoading) return;
    queueMicrotask(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          await loadCourts();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro");
        } finally {
          setLoading(false);
        }
      })();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!courtId) return;
    queueMicrotask(() => {
      void loadProducts(courtId).catch((err) =>
        setError(err instanceof Error ? err.message : "Erro"),
      );
    });
  }, [courtId]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      stock: p.stock == null ? "" : String(p.stock),
      description: p.description ?? "",
    });
    setModalOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!courtId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim() || undefined,
        stock: form.stock === "" ? null : Number(form.stock),
      };
      if (editing) {
        await ProductsService.update(editing._id, payload);
      } else {
        await ProductsService.create({ courtId, ...payload });
      }
      setModalOpen(false);
      await loadProducts(courtId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await ProductsService.remove(deleting._id);
      setDeleting(null);
      await loadProducts(courtId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setDeletingBusy(false);
    }
  }

  const columns: DataColumn<Product>[] = [
    {
      key: "name",
      header: "Produto",
      sortable: true,
      getValue: (r) => r.name,
      render: (r) => <span className="font-semibold text-slate-900">{r.name}</span>,
    },
    {
      key: "description",
      header: "Descrição",
      getValue: (r) => r.description ?? "",
      render: (r) => (
        <span className="text-slate-500">{r.description || "—"}</span>
      ),
    },
    {
      key: "price",
      header: "Preço",
      sortable: true,
      className: "text-right",
      getValue: (r) => r.price,
      render: (r) => (
        <span className="font-medium tabular-nums">
          R$ {Number(r.price).toFixed(2)}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Estoque",
      sortable: true,
      getValue: (r) => r.stock ?? -1,
      render: (r) => (r.stock == null ? "∞" : r.stock),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      getValue: (r) => (r.active ? "Ativo" : "Inativo"),
      render: (r) => (
        <StatusBadge
          label={r.active ? "Ativo" : "Inativo"}
          tone={r.active ? "success" : "neutral"}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Produtos"
        description="Bebidas, snacks e itens da loja da quadra."
        actions={
          <>
            <Link
              href="/dashboard/pos"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Abrir PDV
            </Link>
            <CreateButton label="Novo produto" onClick={openCreate} />
          </>
        }
      />

      <label className="mb-4 block max-w-xs text-sm">
        <span className={labelClass}>Quadra</span>
        <select
          value={courtId}
          onChange={(e) => setCourtId(e.target.value)}
          className={fieldClass}
        >
          {courts.length === 0 && <option value="">Cadastre uma quadra</option>}
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
        rows={products}
        columns={columns}
        getRowId={(r) => r._id}
        loading={loading}
        searchPlaceholder="Buscar produto…"
        searchKeys={[(r) => r.name, (r) => r.description ?? ""]}
        emptyMessage="Nenhum produto neste catálogo."
        actions={[
          { label: "Editar", onClick: openEdit },
          {
            label: "Desativar",
            tone: "danger",
            onClick: (r) => {
              if (r.active) setDeleting(r);
            },
          },
        ]}
      />

      <Modal
        open={modalOpen}
        title={editing ? "Editar produto" : "Novo produto"}
        onClose={() => setModalOpen(false)}
        size="md"
      >
        <form onSubmit={onSave} className="space-y-4">
          <label className="block">
            <span className={labelClass}>Nome</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Preço (R$)</span>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Estoque (vazio = ilimitado)</span>
            <input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Descrição</span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              className={fieldClass}
            />
          </label>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !courtId}
              className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Desativar produto"
        message={`Desativar "${deleting?.name}"?`}
        confirmLabel="Desativar"
        loading={deletingBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
