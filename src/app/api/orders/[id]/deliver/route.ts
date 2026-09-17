import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";

function jsonResult(result: Awaited<ReturnType<typeof backendFetch>>) {
  return NextResponse.json(
    result.body ?? { success: false, error: "Resposta vazia" },
    { status: result.status || 502 },
  );
}

function errorResponse(error: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: error instanceof Error ? error.message : "Erro interno no proxy",
    },
    { status: 500 },
  );
}

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    return jsonResult(
      await backendFetch(`/orders/${id}/deliver`, {
        method: "POST",
        body: "{}",
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
