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

export async function GET(request: Request) {
  try {
    const qs = new URL(request.url).searchParams.toString();
    return jsonResult(
      await backendFetch(qs ? `/championships?${qs}` : "/championships"),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    return jsonResult(
      await backendFetch("/championships", { method: "POST", body }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
