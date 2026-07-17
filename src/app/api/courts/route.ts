import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";

function jsonResult(result: Awaited<ReturnType<typeof backendFetch>>) {
  const body = result.body ?? { success: false, error: "Resposta vazia" };
  return NextResponse.json(body, { status: result.status || 502 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const path = qs ? `/courts?${qs}` : "/courts";
    return jsonResult(await backendFetch(path));
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno no proxy /courts",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    return jsonResult(
      await backendFetch("/courts", { method: "POST", body }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno no proxy /courts",
      },
      { status: 500 },
    );
  }
}
