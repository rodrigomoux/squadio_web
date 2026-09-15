"use client";

import { useRef, useState } from "react";

import { ImageCropModal } from "@/components/media/ImageCropModal";
import { readFileAsDataUrl } from "@/lib/media/cropImage";
import { MediaService } from "@/services/domain/DomainService";

const MAX_PHOTOS = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  aspect?: number;
  disabled?: boolean;
};

export function PhotoGalleryUpload({
  value,
  onChange,
  max = MAX_PHOTOS,
  aspect = 16 / 9,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = max - value.length;
  const canAdd = remaining > 0 && !disabled && !uploading;

  function openPicker() {
    setError(null);
    inputRef.current?.click();
  }

  async function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Use JPEG, PNG, WebP ou GIF.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("Arquivo muito grande (máx. 12MB antes do crop).");
      return;
    }
    if (value.length >= max) {
      setError(`Limite de ${max} fotos.`);
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropSrc(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao ler imagem");
    }
  }

  async function onCropConfirm(dataUrl: string) {
    setUploading(true);
    setError(null);
    try {
      const media = await MediaService.uploadBase64(dataUrl);
      onChange([...value, media.url]);
      setCropSrc(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Fotos
        </h3>
        <span className="text-xs text-slate-400">
          {value.length}/{max}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {value.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Foto ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100"
              >
                Remover
              </button>
            )}
          </div>
        ))}

        {canAdd && (
          <button
            type="button"
            onClick={openPicker}
            className="flex aspect-video flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-[#2563eb] hover:bg-blue-50/50 hover:text-[#2563eb]"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-xs font-medium">Adicionar</span>
          </button>
        )}
      </div>

      {uploading && (
        <p className="text-xs text-slate-500">Enviando imagem para o bucket…</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => void onFileChange(e.target.files)}
      />

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={aspect}
          onCancel={() => {
            if (!uploading) setCropSrc(null);
          }}
          onConfirm={onCropConfirm}
        />
      )}
    </div>
  );
}
