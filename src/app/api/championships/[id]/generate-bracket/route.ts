import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const result = await backendFetch(`/championships/${id}/generate-bracket`, {
      method: "POST",
      body: "{}",
    });
    return NextResponse.json(result.body, { status: result.status || 502 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro" },
      { status: 500 },
    );
  }
}
