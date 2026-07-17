"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetCode(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        message?: string;
        resetCode?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Falha na solicitação");
      setMessage(data.message ?? "Verifique seu e-mail.");
      if (data.resetCode) setResetCode(data.resetCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8">
        <h1 className="text-xl font-semibold">Recuperar senha</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enviaremos um código para o e-mail cadastrado.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-900"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}
          {resetCode && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Dev — código: <strong>{resetCode}</strong>
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#1a2332] py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar código"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/reset-password" className="underline">
            Já tenho o código
          </Link>
          {" · "}
          <Link href="/login" className="underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
