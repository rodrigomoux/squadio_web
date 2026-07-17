import { Suspense } from "react";

import LoginPage from "./page.client";

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center">
          <p className="text-sm text-zinc-500">Carregando...</p>
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
