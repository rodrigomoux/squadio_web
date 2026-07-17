"use client";

import { useEffect, useState } from "react";

import { CourtForm } from "@/components/courts/CourtForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import {
  CreateButton,
  PageHeader,
  StatusBadge,
} from "@/components/ui/PageHeader";
import { sportLabel } from "@/config/sports";
import { isMongoObjectId } from "@/lib/auth/objectId";
import type { Court } from "@/lib/domain/types";
import { useAuth } from "@/providers/AuthProvider";
import { CourtsService } from "@/services/domain/DomainService";

export default function CourtsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Court | null>(null);
  const [deleting, setDeleting] = useState<Court | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const mockSession = Boolean(user?.id && !isMongoObjectId(user.id));

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (mockSession) {
        setCourts([]);
        setError(
          "Sessão mock. Faça logout e entre com uma conta real via Primeiro acesso.",
        );
        return;
      }
      const list = await CourtsService.list(
        isMongoObjectId(user?.id) ? { ownerId: user.id } : undefined,
      );
      setCourts(list);
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
      await CourtsService.remove(deleting._id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setDeletingBusy(false);
    }
  }

  const columns: DataColumn<Court>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      getValue: (r) => r.name,
      render: (r) => <span className="font-semibold text-slate-900">{r.name}</span>,
    },
    {
      key: "address",
      header: "Endereço",
      sortable: true,
      getValue: (r) => r.address,
      render: (r) => (
        <span className="max-w-[220px] truncate block text-slate-500">
          {r.address}
        </span>
      ),
    },
    {
      key: "modalities",
      header: "Modalidades",
      getValue: (r) => r.modalities.map(sportLabel).join(", "),
      render: (r) =>
        r.modalities.map(sportLabel).join(" · ") || (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "price",
      header: "Preço/h",
      sortable: true,
      className: "text-right",
      getValue: (r) => r.pricePerHour,
      render: (r) => (
        <span className="font-medium tabular-nums">
          R$ {Number(r.pricePerHour).toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      getValue: (r) => (r.active ? "Ativa" : "Inativa"),
      render: (r) => (
        <StatusBadge
          label={r.active ? "Ativa" : "Inativa"}
          tone={r.active ? "success" : "neutral"}
        />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Quadras"
        description="Cadastre e gerencie as quadras do seu estabelecimento."
        actions={
          <CreateButton
            label="Nova quadra"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          />
        }
      />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <DataTable
        rows={courts}
        columns={columns}
        getRowId={(r) => r._id}
        loading={loading}
        searchPlaceholder="Buscar por nome, endereço, modalidade…"
        searchKeys={[
          (r) => r.name,
          (r) => r.address,
          (r) => r.modalities.map(sportLabel).join(" "),
        ]}
        emptyMessage="Nenhuma quadra cadastrada ainda."
        actions={[
          {
            label: "Editar",
            onClick: (r) => {
              setEditing(r);
              setModalOpen(true);
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
        open={modalOpen}
        title={editing ? "Editar quadra" : "Nova quadra"}
        description="Preencha os dados e salve para atualizar o catálogo."
        onClose={() => setModalOpen(false)}
        size="xl"
      >
        <CourtForm
          key={editing?._id ?? "new"}
          initial={editing}
          redirectOnSuccess={false}
          onCancel={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            void load();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Desativar quadra"
        message={`Desativar "${deleting?.name}"? Ela deixará de aparecer nas buscas.`}
        confirmLabel="Desativar"
        loading={deletingBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
