import Link from "next/link";

import { authConfig } from "@/config/auth.config";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <main className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Squadio Web
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Next.js 16 com autenticação JWT encriptado, Axios e interceptors.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {session ? (
            <Link
              href={authConfig.routes.dashboard}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Ir para o Dashboard
            </Link>
          ) : (
            <Link
              href={authConfig.routes.login}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Fazer Login
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
