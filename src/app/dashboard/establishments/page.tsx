"use client";

import { useEffect, useState } from "react";

import { EstablishmentForm } from "@/components/establishments/EstablishmentForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import {
  CreateButton,
  PageHeader,
  StatusBadge,
} from "@/components/ui/PageHeader";
import { isMongoObjectId } from "@/lib/auth/objectId";
import type { Establishment } from "@/lib/domain/types";
import { useAuth } from "@/providers/AuthProvider";
import { EstablishmentsService } from "@/services/domain/DomainService";

export default function EstablishmentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Establishment | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<Establishment | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const mockSession = Boolean(user?.id && !isMongoObjectId(user.id));

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (mockSession) {
        setItems([]);
        setError(
          "Sessão mock. Faça logout e entre com uma conta real via Primeiro acesso.",
        );
        return;
      }
      const list = await EstablishmentsService.list(
        isMongoObjectId(user?.id) ? { ownerId: user.id } : undefined,
      );
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    queueMicrotask(() => {
      void load();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await EstablishmentsService.remove(deleting._id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setDeletingBusy(false);
    }
  }

  const columns: DataColumn<Establishment>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      getValue: (r) => r.name,
      render: (r) => (
        <span className="font-semibold text-slate-900">{r.name}</span>
      ),
    },
    {
      key: "address",
      header: "Endereço",
      sortable: true,
      getValue: (r) => r.address,
      render: (r) => (
        <span className="max-w-[280px] truncate block text-slate-500">
          {r.address}
        </span>
      ),
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
        title="Localidades"
        description="Cadastre locais com endereço. Cada localidade pode ter várias quadras."
        actions={
          <CreateButton
            label="Nova localidade"
            onClick={() => setCreateOpen(true)}
          />
        }
      />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <DataTable
        rows={items}
        columns={columns}
        getRowId={(r) => r._id}
        loading={loading}
        searchPlaceholder="Buscar por nome ou endereço…"
        searchKeys={[(r) => r.name, (r) => r.address]}
        emptyMessage="Nenhuma localidade cadastrada ainda."
        actions={[
          {
            label: "Editar",
            onClick: (r) => {
              setEditing(r);
              setEditOpen(true);
            },
          },
          {
            label: "Desativar",
            tone: "danger",
            onClick: (r) => setDeleting(r),
          },
        ]}
      />

      <Modal
        open={createOpen}
        title="Nova localidade"
        description="Informe o endereço do local. Depois cadastre as quadras nele."
        onClose={() => setCreateOpen(false)}
        size="xl"
      >
        <EstablishmentForm
          onCancel={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false);
            void load();
          }}
        />
      </Modal>

      <Modal
        open={editOpen}
        title="Editar localidade"
        description="Alterações de endereço valem para todas as quadras deste local."
        onClose={() => setEditOpen(false)}
        size="xl"
      >
        <EstablishmentForm
          key={editing?._id ?? "edit"}
          initial={editing}
          onCancel={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            void load();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Desativar localidade"
        message={`Desativar "${deleting?.name}"? Ela deixará de aparecer nas buscas.`}
        confirmLabel="Desativar"
        loading={deletingBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
