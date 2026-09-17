"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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
import { sportLabel } from "@/config/sports";
import { isMongoObjectId } from "@/lib/auth/objectId";
import type { AvailabilitySlot, Court, Reservation } from "@/lib/domain/types";
import { useAuth } from "@/providers/AuthProvider";
import { useOwnerRealtime } from "@/providers/OwnerRealtimeProvider";
import { CourtsService, ReservationsService } from "@/services/domain/DomainService";

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reservationTone(
  status: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "confirmed") return "success";
  if (status === "pending") return "warning";
  if (status === "cancelled") return "danger";
  if (status === "completed") return "info";
  return "neutral";
}

export default function ReservationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtId, setCourtId] = useState("");
  const [date, setDate] = useState(toDateInput(new Date()));
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [slotStart, setSlotStart] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState<Reservation | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);

  const selectedCourt = useMemo(
    () => courts.find((c) => c._id === courtId),
    [courts, courtId],
  );

  async function bootstrap() {
    setLoading(true);
    setError(null);
    try {
      if (user?.id && !isMongoObjectId(user.id)) {
        setCourts([]);
        setError(
          "Sessão mock. Faça logout e entre com conta real (Primeiro acesso).",
        );
        return;
      }
      const list = await CourtsService.list(
        isMongoObjectId(user?.id) ? { ownerId: user.id } : undefined,
      );
      setCourts(list);
      if (list[0] && !courtId) setCourtId(list[0]._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  async function loadDay() {
    if (!courtId || !date) return;
    setError(null);
    try {
      const dayStart = new Date(`${date}T00:00:00`);
      const dayEnd = new Date(`${date}T23:59:59`);
      const [resList, availability] = await Promise.all([
        ReservationsService.list({
          courtId,
          from: dayStart.toISOString(),
          to: dayEnd.toISOString(),
          mine: false,
        }),
        CourtsService.availability(courtId, date),
      ]);
      setReservations(resList.filter((r) => r.status !== "cancelled"));
      setSlots(availability);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dia");
    }
  }

  useEffect(() => {
    if (authLoading) return;
    queueMicrotask(() => {
      void bootstrap();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!courtId || !date) return;
    queueMicrotask(() => {
      void loadDay();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId, date]);

  useOwnerRealtime(
    "reservation.created",
    useCallback(
      (event) => {
        if (event.courtId && courtId && event.courtId !== courtId) return;
        void loadDay();
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [courtId, date],
    ),
    Boolean(courtId),
  );

  async function createReservation(e: FormEvent) {
    e.preventDefault();
    if (!courtId || !slotStart) return;
    setSaving(true);
    setError(null);
    try {
      const start = new Date(slotStart);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      await ReservationsService.create({
        courtId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        notes: notes || "Reserva manual (balcão)",
      });
      setNotes("");
      setSlotStart("");
      setModalOpen(false);
      await loadDay();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reservar");
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancel() {
    if (!cancelling) return;
    setCancelBusy(true);
    try {
      await ReservationsService.cancel(cancelling._id);
      setCancelling(null);
      await loadDay();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cancelar");
    } finally {
      setCancelBusy(false);
    }
  }

  const columns: DataColumn<Reservation>[] = [
    {
      key: "start",
      header: "Horário",
      sortable: true,
      getValue: (r) => new Date(r.startAt).getTime(),
      render: (r) => (
        <span className="font-semibold text-slate-900">
          {formatTime(r.startAt)} – {formatTime(r.endAt)}
        </span>
      ),
    },
    {
      key: "notes",
      header: "Observação",
      getValue: (r) => r.notes ?? "",
      render: (r) => (
        <span className="text-slate-500">{r.notes || "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      getValue: (r) => r.status,
      render: (r) => (
        <StatusBadge label={r.status} tone={reservationTone(r.status)} />
      ),
    },
    {
      key: "price",
      header: "Valor",
      sortable: true,
      className: "text-right",
      getValue: (r) => r.totalPrice,
      render: (r) => (
        <span className="font-medium tabular-nums">
          R$ {Number(r.totalPrice).toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Reservas"
        description="Agenda do dia, busca e reserva manual no balcão."
        actions={
          <CreateButton
            label="Nova reserva"
            onClick={() => {
              setSlotStart("");
              setNotes("");
              setModalOpen(true);
            }}
          />
        }
      />

      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-sm">
          <span className={labelClass}>Quadra</span>
          <select
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
            className={`min-w-[220px] ${fieldClass}`}
          >
            {courts.length === 0 && <option value="">Sem quadras</option>}
            {courts.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className={labelClass}>Data</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
          />
        </label>
        {selectedCourt && (
          <div className="flex items-end pb-2 text-sm text-slate-500">
            {selectedCourt.modalities.map(sportLabel).join(", ")} · R${" "}
            {Number(selectedCourt.pricePerHour).toFixed(2)}/h
          </div>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <DataTable
        rows={reservations}
        columns={columns}
        getRowId={(r) => r._id}
        loading={loading}
        searchPlaceholder="Buscar por status ou observação…"
        searchKeys={[(r) => r.status, (r) => r.notes ?? ""]}
        emptyMessage="Nenhuma reserva neste dia."
        actions={[
          {
            label: "Cancelar",
            tone: "danger",
            onClick: (r) => setCancelling(r),
          },
        ]}
      />

      <Modal
        open={modalOpen}
        title="Nova reserva (balcão)"
        description="Escolha um horário disponível e confirme."
        onClose={() => setModalOpen(false)}
        size="md"
      >
        <form onSubmit={createReservation} className="space-y-4">
          <label className="block">
            <span className={labelClass}>Horário disponível</span>
            <select
              required
              value={slotStart}
              onChange={(e) => setSlotStart(e.target.value)}
              className={fieldClass}
            >
              <option value="">Selecione</option>
              {slots.map((slot) => (
                <option key={slot.start} value={slot.start}>
                  {formatTime(slot.start)} – {formatTime(slot.end)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot.start}
                type="button"
                onClick={() => setSlotStart(slot.start)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  slotStart === slot.start
                    ? "bg-[#2563eb] text-white"
                    : "bg-emerald-50 text-emerald-800"
                }`}
              >
                {formatTime(slot.start)}
              </button>
            ))}
            {slots.length === 0 && (
              <span className="text-sm text-slate-500">Sem horários livres</span>
            )}
          </div>
          <label className="block">
            <span className={labelClass}>Observação</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nome do cliente, telefone…"
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
              disabled={saving || !courtId || slots.length === 0}
              className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Criar reserva"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancelar reserva"
        message="Esta reserva será cancelada e o horário liberado."
        confirmLabel="Cancelar reserva"
        loading={cancelBusy}
        onCancel={() => setCancelling(null)}
        onConfirm={() => void confirmCancel()}
      />
    </div>
  );
}
