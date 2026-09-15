"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { PhotoGalleryUpload } from "@/components/media/PhotoGalleryUpload";
import { fieldClass, labelClass } from "@/components/ui/PageHeader";
import type { Establishment, EstablishmentFormData } from "@/lib/domain/types";
import { EstablishmentsService } from "@/services/domain/DomainService";
import {
  formatCep,
  geocodeAddress,
  lookupCep,
} from "@/services/location/cep";

type Props = {
  initial?: Establishment | null;
  onSuccess?: (establishment: Establishment) => void;
  onCancel?: () => void;
};

function toForm(est: Establishment): EstablishmentFormData {
  const [lng, lat] = est.location?.coordinates ?? [-46.6333, -23.5505];
  return {
    name: est.name,
    description: est.description ?? "",
    address: est.address,
    lat,
    lng,
    photos: est.photos ?? [],
  };
}

const emptyForm: EstablishmentFormData = {
  name: "",
  description: "",
  address: "",
  lat: -23.5505,
  lng: -46.6333,
  photos: [],
};

function composeAddress(baseAddress: string, number: string): string {
  const n = number.trim();
  if (!n || !baseAddress) return baseAddress;
  const withoutNumber = baseAddress.replace(/^([^,]+),\s*\d+[A-Za-z]?\s*/, "$1");
  const comma = withoutNumber.indexOf(",");
  if (comma === -1) return `${withoutNumber}, ${n}`;
  return `${withoutNumber.slice(0, comma)}, ${n}${withoutNumber.slice(comma)}`;
}

export function EstablishmentForm({ initial, onSuccess, onCancel }: Props) {
  const base = useMemo(
    () => (initial ? toForm(initial) : emptyForm),
    [initial],
  );
  const [form, setForm] = useState<EstablishmentFormData>(base);
  const [cep, setCep] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepHint, setCepHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(base);
    setCep("");
    setStreetNumber("");
    setCepHint(null);
  }, [base]);

  async function searchCep(rawCep?: string) {
    const value = rawCep ?? cep;
    setCepHint(null);
    setError(null);
    setCepLoading(true);
    try {
      const found = await lookupCep(value);
      setCep(found.cep);
      const withNumber = composeAddress(found.formatted, streetNumber);
      setForm((prev) => ({
        ...prev,
        address: withNumber || found.formatted,
      }));

      const coords = await geocodeAddress(
        `${found.formatted}${streetNumber.trim() ? `, ${streetNumber.trim()}` : ""}, ${found.cep}`,
      );
      if (coords) {
        setForm((prev) => ({
          ...prev,
          address: withNumber || found.formatted,
          lat: coords.lat,
          lng: coords.lng,
        }));
        setCepHint(
          "Endereço e coordenadas preenchidos. Confira o número e ajuste se preciso.",
        );
      } else {
        setCepHint(
          "Endereço preenchido. Não foi possível obter lat/lng automaticamente — preencha manualmente.",
        );
      }
    } catch (err) {
      setCepHint(err instanceof Error ? err.message : "Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  }

  function onCepChange(value: string) {
    const formatted = formatCep(value);
    setCep(formatted);
    if (formatted.replace(/\D/g, "").length === 8) {
      void searchCep(formatted);
    }
  }

  function onStreetNumberChange(value: string) {
    setStreetNumber(value);
    setForm((prev) => ({
      ...prev,
      address: value.trim()
        ? composeAddress(prev.address, value)
        : prev.address.replace(/^([^,]+),\s*\d+[A-Za-z]?\s*/, "$1"),
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!form.name.trim() || !form.address.trim()) {
        throw new Error("Nome e endereço são obrigatórios");
      }
      const establishment = initial?._id
        ? await EstablishmentsService.update(initial._id, form)
        : await EstablishmentsService.create(form);
      onSuccess?.(establishment);
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
          Dados da localidade
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Nome</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={fieldClass}
              placeholder="Ex.: Arena Centro"
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

          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-[1fr_auto_7rem]">
            <label className="block">
              <span className={labelClass}>CEP</span>
              <input
                value={cep}
                onChange={(e) => onCepChange(e.target.value)}
                onBlur={() => {
                  if (cep.replace(/\D/g, "").length === 8) void searchCep();
                }}
                className={fieldClass}
                placeholder="00000-000"
                inputMode="numeric"
                autoComplete="postal-code"
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                disabled={cepLoading || cep.replace(/\D/g, "").length !== 8}
                onClick={() => void searchCep()}
                className="h-[42px] rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {cepLoading ? "Buscando…" : "Buscar"}
              </button>
            </div>
            <label className="block">
              <span className={labelClass}>Número</span>
              <input
                value={streetNumber}
                onChange={(e) => onStreetNumberChange(e.target.value)}
                className={fieldClass}
                placeholder="123"
              />
            </label>
          </div>
          {cepHint && (
            <p className="sm:col-span-2 text-xs text-slate-500">{cepHint}</p>
          )}

          <label className="block sm:col-span-2">
            <span className={labelClass}>Endereço</span>
            <input
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={fieldClass}
              placeholder="Rua, número, bairro, cidade - UF"
            />
          </label>
          <label className="block">
            <span className={labelClass}>Latitude</span>
            <input
              type="number"
              step="any"
              required
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Longitude</span>
            <input
              type="number"
              step="any"
              required
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })}
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      <PhotoGalleryUpload
        value={form.photos ?? []}
        onChange={(photos) => setForm((prev) => ({ ...prev, photos }))}
        max={5}
        aspect={16 / 9}
        disabled={loading}
      />

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
