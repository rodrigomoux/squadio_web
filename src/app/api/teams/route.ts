import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";

function jsonResult(result: Awaited<ReturnType<typeof backendFetch>>) {
  return NextResponse.json(
    result.body ?? { success: false, error: "Resposta vazia" },
    { status: result.status || 502 },
  );
}

export async function GET(request: Request) {
  try {
    const qs = new URL(request.url).searchParams.toString();
    return jsonResult(await backendFetch(qs ? `/teams?${qs}` : "/teams"));
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    return jsonResult(await backendFetch("/teams", { method: "POST", body }));
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro" },
      { status: 500 },
    );
  }
}
