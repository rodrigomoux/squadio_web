"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

/**
 * Primeiro acesso do gestor: cadastro como court_owner + confirmação de e-mail.
 */
export default function FirstAccessPage() {
  const router = useRouter();
  const [step, setStep] = useState<"register" | "confirm">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function register(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: "court_owner",
        }),
      });
      const data = (await res.json()) as {
        message?: string;
        confirmationCode?: string;
      };
      if (!res.ok) throw new Error(data.message ?? "Falha no cadastro");
      if (data.confirmationCode) setDevCode(data.confirmationCode);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Falha na confirmação");
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f8] px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8">
        <h1 className="text-xl font-semibold">Primeiro acesso</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Crie a conta do gestor da quadra.
        </p>

        {step === "register" ? (
          <form onSubmit={register} className="mt-6 space-y-4">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1a2332] py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Criando..." : "Criar conta"}
            </button>
          </form>
        ) : (
          <form onSubmit={confirm} className="mt-6 space-y-4">
            <p className="text-sm text-zinc-600">
              Digite o código enviado para <strong>{email}</strong>.
            </p>
            {devCode && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Dev — código: <strong>{devCode}</strong>
              </p>
            )}
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de 6 dígitos"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1a2332] py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Confirmando..." : "Confirmar e-mail"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="underline">
            Já tenho conta
          </Link>
        </p>
      </div>
    </div>
  );
}
