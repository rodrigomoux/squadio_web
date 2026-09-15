"use client";

import Link from "next/link";
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
import type { Court, Establishment } from "@/lib/domain/types";
import { useAuth } from "@/providers/AuthProvider";
import {
  CourtsService,
  EstablishmentsService,
} from "@/services/domain/DomainService";

type CreateStep = "closed" | "pick-establishment" | "pick-type" | "form";

export default function CourtsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState<CreateStep>("closed");
  const [createEstablishmentId, setCreateEstablishmentId] = useState<string | null>(
    null,
  );
  const [createIsPublic, setCreateIsPublic] = useState(false);
  const [editing, setEditing] = useState<Court | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<Court | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const mockSession = Boolean(user?.id && !isMongoObjectId(user.id));

  const selectedEstablishment = establishments.find(
    (e) => e._id === createEstablishmentId,
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (mockSession) {
        setCourts([]);
        setEstablishments([]);
        setError(
          "Sessão mock. Faça logout e entre com uma conta real via Primeiro acesso.",
        );
        return;
      }
      const ownerFilter = isMongoObjectId(user?.id)
        ? { ownerId: user.id }
        : undefined;
      const [list, estList] = await Promise.all([
        CourtsService.list(ownerFilter),
        EstablishmentsService.list(ownerFilter),
      ]);
      setCourts(list);
      setEstablishments(estList);
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

  function openCreate() {
    setEditing(null);
    setCreateEstablishmentId(null);
    setCreateIsPublic(false);
    setCreateStep("pick-establishment");
  }

  function closeCreate() {
    setCreateStep("closed");
    setCreateEstablishmentId(null);
  }

  function chooseEstablishment(id: string) {
    setCreateEstablishmentId(id);
    setCreateStep("pick-type");
  }

  function chooseType(isPublic: boolean) {
    setCreateIsPublic(isPublic);
    setCreateStep("form");
  }

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
      key: "establishment",
      header: "Localidade",
      sortable: true,
      getValue: (r) => r.establishment?.name ?? "",
      render: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-800">
            {r.establishment?.name ?? "—"}
          </p>
          <p className="max-w-[200px] truncate text-xs text-slate-500">
            {r.address || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      sortable: true,
      getValue: (r) => (r.isPublic ? "Pública" : "Privada"),
      render: (r) => (
        <StatusBadge
          label={r.isPublic ? "Pública" : "Privada"}
          tone={r.isPublic ? "neutral" : "success"}
        />
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
      render: (r) =>
        r.isPublic ? (
          <span className="text-slate-400">—</span>
        ) : (
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
        description="Cadastre quadras em uma localidade, com configurações próprias."
        actions={<CreateButton label="Nova quadra" onClick={openCreate} />}
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
        searchPlaceholder="Buscar por nome, localidade, modalidade…"
        searchKeys={[
          (r) => r.name,
          (r) => r.address,
          (r) => r.establishment?.name ?? "",
          (r) => r.modalities.map(sportLabel).join(" "),
          (r) => (r.isPublic ? "pública publica" : "privada"),
        ]}
        emptyMessage="Nenhuma quadra cadastrada ainda."
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
        open={createStep === "pick-establishment"}
        title="Nova quadra"
        description="Escolha a localidade onde a quadra fica."
        onClose={closeCreate}
        size="md"
      >
        {establishments.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Cadastre uma localidade (com endereço) antes de criar a
              quadra.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCreate}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <Link
                href="/dashboard/establishments"
                className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Ir para localidades
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {establishments.map((est) => (
              <button
                key={est._id}
                type="button"
                onClick={() => chooseEstablishment(est._id)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#2563eb] hover:bg-blue-50/40"
              >
                <p className="text-sm font-semibold text-slate-900">{est.name}</p>
                <p className="mt-1 text-xs text-slate-500">{est.address}</p>
              </button>
            ))}
            <div className="flex justify-between pt-2">
              <Link
                href="/dashboard/establishments"
                className="text-sm font-medium text-[#2563eb] hover:underline"
              >
                Nova localidade
              </Link>
              <button
                type="button"
                onClick={closeCreate}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={createStep === "pick-type"}
        title="Tipo da quadra"
        description={`Localidade: ${selectedEstablishment?.name ?? ""}`}
        onClose={closeCreate}
        size="md"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => chooseType(false)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#2563eb] hover:bg-blue-50/40"
          >
            <p className="text-sm font-semibold text-slate-900">Privada</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Aceita reservas e preço por hora. Ideal para aluguel.
            </p>
          </button>
          <button
            type="button"
            onClick={() => chooseType(true)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#2563eb] hover:bg-blue-50/40"
          >
            <p className="text-sm font-semibold text-slate-900">Pública</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Horários com chat por slot, sem reserva paga.
            </p>
          </button>
        </div>
        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={() => setCreateStep("pick-establishment")}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={closeCreate}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </Modal>

      <Modal
        open={createStep === "form"}
        title={createIsPublic ? "Nova quadra pública" : "Nova quadra privada"}
        description="Preencha a configuração desta quadra."
        onClose={closeCreate}
        size="xl"
      >
        {createEstablishmentId && (
          <CourtForm
            key={`new-${createEstablishmentId}-${createIsPublic ? "public" : "private"}`}
            establishmentId={createEstablishmentId}
            establishmentLabel={selectedEstablishment?.name}
            defaultIsPublic={createIsPublic}
            redirectOnSuccess={false}
            onCancel={closeCreate}
            onSuccess={() => {
              closeCreate();
              void load();
            }}
          />
        )}
      </Modal>

      <Modal
        open={editOpen}
        title="Editar quadra"
        description="Endereço é editado na localidade; aqui só a configuração da quadra."
        onClose={() => setEditOpen(false)}
        size="xl"
      >
        <CourtForm
          key={editing?._id ?? "edit"}
          initial={editing}
          redirectOnSuccess={false}
          onCancel={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
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
