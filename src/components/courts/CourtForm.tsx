"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { PhotoGalleryUpload } from "@/components/media/PhotoGalleryUpload";
import { fieldClass, labelClass } from "@/components/ui/PageHeader";
import { SPORT_MODALITIES, WEEKDAYS } from "@/config/sports";
import type { Court, CourtFormData, OpeningHour } from "@/lib/domain/types";
import { CourtsService } from "@/services/domain/DomainService";

const defaultHours: OpeningHour[] = WEEKDAYS.map((d) => ({
  dayOfWeek: d.dayOfWeek,
  open: "08:00",
  close: "22:00",
}));

type Props = {
  initial?: Court | null;
  /** Obrigatório na criação */
  establishmentId?: string;
  establishmentLabel?: string;
  /** Definido no modal de tipo ao criar; na edição usa o valor da quadra. */
  defaultIsPublic?: boolean;
  onSuccess?: (court: Court) => void;
  onCancel?: () => void;
  /** Se false, não redireciona (uso em modal) */
  redirectOnSuccess?: boolean;
};

function courtToForm(court: Court): CourtFormData {
  return {
    establishmentId: court.establishmentId ?? "",
    name: court.name,
    description: court.description ?? "",
    modalities: court.modalities ?? [],
    photos: court.photos ?? [],
    pricePerHour: court.pricePerHour,
    isPublic: Boolean(court.isPublic),
    openingHours: court.openingHours?.length ? court.openingHours : defaultHours,
  };
}

const emptyForm = (establishmentId: string, isPublic: boolean): CourtFormData => ({
  establishmentId,
  name: "",
  description: "",
  modalities: [],
  photos: [],
  pricePerHour: isPublic ? 0 : 100,
  isPublic,
  openingHours: defaultHours,
});

export function CourtForm({
  initial,
  establishmentId,
  establishmentLabel,
  defaultIsPublic = false,
  onSuccess,
  onCancel,
  redirectOnSuccess = true,
}: Props) {
  const base = useMemo(() => {
    if (initial) return courtToForm(initial);
    return emptyForm(establishmentId ?? "", defaultIsPublic);
  }, [initial, establishmentId, defaultIsPublic]);

  const [form, setForm] = useState<CourtFormData>(base);
  const isPublic = Boolean(form.isPublic);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(base);
  }, [base]);

  function toggleModality(id: string) {
    setForm((prev) => ({
      ...prev,
      modalities: prev.modalities.includes(id)
        ? prev.modalities.filter((m) => m !== id)
        : [...prev.modalities, id],
    }));
  }

  function updateHour(dayOfWeek: number, field: "open" | "close", value: string) {
    setForm((prev) => ({
      ...prev,
      openingHours: prev.openingHours.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h,
      ),
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!form.name.trim()) {
        throw new Error("Nome é obrigatório");
      }
      if (!initial && !form.establishmentId) {
        throw new Error("Selecione uma localidade");
      }
      if (form.modalities.length === 0) {
        throw new Error("Selecione ao menos uma modalidade");
      }
      const payload: CourtFormData = {
        ...form,
        pricePerHour: form.isPublic ? 0 : form.pricePerHour,
      };
      const court = initial?._id
        ? await CourtsService.update(initial._id, {
            name: payload.name,
            description: payload.description,
            modalities: payload.modalities,
            photos: payload.photos,
            pricePerHour: payload.pricePerHour,
            isPublic: payload.isPublic,
            openingHours: payload.openingHours,
          })
        : await CourtsService.create(payload);
      onSuccess?.(court);
      if (redirectOnSuccess && !onSuccess) {
        window.location.href = "/dashboard/courts";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Dados da quadra
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {(establishmentLabel || initial?.establishment?.name || initial?.address) && (
            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Localidade
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {establishmentLabel ||
                  initial?.establishment?.name ||
                  "Localidade"}
              </p>
              {initial?.address && (
                <p className="mt-0.5 text-xs text-slate-500">{initial.address}</p>
              )}
            </div>
          )}
          <label className="block sm:col-span-2">
            <span className={labelClass}>Nome da quadra</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={fieldClass}
              placeholder="Ex.: Quadra 1 — Society"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Descrição</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className={fieldClass}
            />
          </label>
          <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              {isPublic ? "Quadra pública" : "Quadra privada"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {isPublic
                ? "Horários com chat por slot, sem reserva paga."
                : "Aceita reservas e preço por hora."}
            </p>
          </div>
          {!isPublic && (
            <label className="block">
              <span className={labelClass}>Preço / hora (R$)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={form.pricePerHour}
                onChange={(e) =>
                  setForm({ ...form, pricePerHour: Number(e.target.value) })
                }
                className={fieldClass}
              />
            </label>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Modalidades
        </h3>
        <div className="flex flex-wrap gap-2">
          {SPORT_MODALITIES.map((sport) => {
            const active = form.modalities.includes(sport.id);
            return (
              <button
                key={sport.id}
                type="button"
                onClick={() => toggleModality(sport.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-[#2563eb] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {sport.label}
              </button>
            );
          })}
        </div>
      </section>

      {isPublic && (
        <PhotoGalleryUpload
          value={form.photos ?? []}
          onChange={(photos) => setForm((prev) => ({ ...prev, photos }))}
          max={5}
          aspect={16 / 9}
          disabled={loading}
        />
      )}

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Horários
        </h3>
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {WEEKDAYS.map((day) => {
            const hour = form.openingHours.find((h) => h.dayOfWeek === day.dayOfWeek)!;
            return (
              <div
                key={day.dayOfWeek}
                className="grid grid-cols-[3rem_1fr_1fr] items-center gap-3"
              >
                <span className="text-sm font-medium text-slate-700">{day.label}</span>
                <input
                  type="time"
                  value={hour.open}
                  onChange={(e) => updateHour(day.dayOfWeek, "open", e.target.value)}
                  className={fieldClass}
                />
                <input
                  type="time"
                  value={hour.close}
                  onChange={(e) => updateHour(day.dayOfWeek, "close", e.target.value)}
                  className={fieldClass}
                />
              </div>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
        >
          {loading ? "Salvando..." : initial ? "Salvar" : "Cadastrar"}
        </button>
      </div>
    </form>
  );
}
