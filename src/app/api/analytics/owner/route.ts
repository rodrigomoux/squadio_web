import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";

export async function GET() {
  try {
    const result = await backendFetch("/analytics/owner");
    const body = result.body ?? { success: false, error: "Resposta vazia" };
    return NextResponse.json(body, { status: result.status || 502 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno no proxy /analytics/owner",
      },
      { status: 500 },
    );
  }
}
