import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";

function jsonResult(result: Awaited<ReturnType<typeof backendFetch>>) {
  const body = result.body ?? { success: false, error: "Resposta vazia" };
  return NextResponse.json(body, { status: result.status || 502 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get("amount");
    const qs = amount != null ? `?amount=${encodeURIComponent(amount)}` : "";
    return jsonResult(await backendFetch(`/payments/fees${qs}`));
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno no proxy /payments/fees",
      },
      { status: 500 },
    );
  }
}
