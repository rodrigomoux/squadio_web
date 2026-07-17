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

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    return jsonResult(await backendFetch(`/courts/${id}`));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.text();
    return jsonResult(
      await backendFetch(`/courts/${id}`, { method: "PATCH", body }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    return jsonResult(await backendFetch(`/courts/${id}`, { method: "DELETE" }));
  } catch (error) {
    return errorResponse(error);
  }
}
