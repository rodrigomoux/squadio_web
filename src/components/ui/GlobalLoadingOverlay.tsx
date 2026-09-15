"use client";

type Props = {
  open: boolean;
};

export function GlobalLoadingOverlay({ open }: Props) {
  if (!open) return null;

  return (
    <div
      className="sq-global-loading fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-4 flex min-w-[220px] flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white px-8 py-7 shadow-2xl shadow-slate-900/20">
        <div className="sq-loading-ring" aria-hidden />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">
            Carregando dados
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Buscando informações na API…
          </p>
        </div>
      </div>
    </div>
  );
}
