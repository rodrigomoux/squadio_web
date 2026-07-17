"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import {
  CreateButton,
  PageHeader,
  StatusBadge,
  fieldClass,
  labelClass,
} from "@/components/ui/PageHeader";
import { SPORT_MODALITIES, sportLabel } from "@/config/sports";
import { isMongoObjectId } from "@/lib/auth/objectId";
import type { Championship, Court } from "@/lib/domain/types";
import { useAuth } from "@/providers/AuthProvider";
import {
  ChampionshipsService,
  CourtsService,
} from "@/services/domain/DomainService";

function statusTone(status: string): "success" | "warning" | "info" | "neutral" {
  if (status === "open") return "success";
  if (status === "in_progress") return "info";
  if (status === "finished") return "neutral";
  return "warning";
}

export default function ChampionshipsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<Championship[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState("");
  const [modality, setModality] = useState("futsal");
  const [format, setFormat] = useState("knockout");
  const [courtId, setCourtId] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      if (user?.id && !isMongoObjectId(user.id)) {
        setError("Sessão mock. Entre com conta real de gestor.");
        return;
      }
      const [list, courtList] = await Promise.all([
        ChampionshipsService.list({
          scope: "professional",
          organizerId: isMongoObjectId(user?.id) ? user.id : undefined,
        }),
        CourtsService.list(
          isMongoObjectId(user?.id) ? { ownerId: user.id } : undefined,
        ),
      ]);
      setItems(list);
      setCourts(courtList);
      if (courtList[0] && !courtId) setCourtId(courtList[0]._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await ChampionshipsService.create({
        name: name.trim(),
        modality,
        format,
        scope: "professional",
        courtId: courtId || undefined,
      });
      setName("");
      setModalOpen(false);
      await load();
      router.push(`/dashboard/championships/${created._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar");
    } finally {
      setSaving(false);
    }
  }

  const columns: DataColumn<Championship>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      getValue: (r) => r.name,
      render: (r) => (
        <Link
          href={`/dashboard/championships/${r._id}`}
          className="font-semibold text-[#1d4ed8] hover:underline"
        >
          {r.name}
        </Link>
      ),
    },
    {
      key: "modality",
      header: "Modalidade",
      sortable: true,
      getValue: (r) => sportLabel(r.modality),
      render: (r) => sportLabel(r.modality),
    },
    {
      key: "format",
      header: "Formato",
      sortable: true,
      getValue: (r) => r.format,
      render: (r) =>
        r.format === "knockout" ? "Mata-mata" : "Pontos corridos",
    },
    {
      key: "teams",
      header: "Times",
      sortable: true,
      getValue: (r) => r.teamIds?.length ?? 0,
      render: (r) => r.teamIds?.length ?? 0,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      getValue: (r) => r.status,
      render: (r) => (
        <StatusBadge label={r.status} tone={statusTone(r.status)} />
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Campeonatos"
        description="Crie torneios profissionais, gere chaves e registre resultados."
        actions={
          <CreateButton
            label="Novo campeonato"
            onClick={() => setModalOpen(true)}
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
        searchPlaceholder="Buscar campeonato…"
        searchKeys={[
          (r) => r.name,
          (r) => sportLabel(r.modality),
          (r) => r.status,
        ]}
        emptyMessage="Nenhum campeonato ainda."
        actions={[
          {
            label: "Gerenciar",
            onClick: (r) => router.push(`/dashboard/championships/${r._id}`),
          },
        ]}
      />

      <Modal
        open={modalOpen}
        title="Novo campeonato"
        description="Defina nome, modalidade e formato do torneio."
        onClose={() => setModalOpen(false)}
        size="md"
      >
        <form onSubmit={onCreate} className="space-y-4">
          <label className="block">
            <span className={labelClass}>Nome</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Modalidade</span>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              className={fieldClass}
            >
              {SPORT_MODALITIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Formato</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className={fieldClass}
            >
              <option value="knockout">Mata-mata</option>
              <option value="round_robin">Pontos corridos</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Quadra (opcional)</span>
            <select
              value={courtId}
              onChange={(e) => setCourtId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Sem quadra vinculada</option>
              {courts.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
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
              disabled={saving}
              className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Criando…" : "Criar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
