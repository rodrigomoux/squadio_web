import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";

function jsonResult(result: Awaited<ReturnType<typeof backendFetch>>) {
  return NextResponse.json(result.body ?? { success: false, error: "Resposta vazia" }, {
    status: result.status || 502,
  });
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

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const path = date
      ? `/courts/${id}/availability?date=${encodeURIComponent(date)}`
      : `/courts/${id}/availability`;
    return jsonResult(await backendFetch(path));
  } catch (error) {
    return errorResponse(error);
  }
}
