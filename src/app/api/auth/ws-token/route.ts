import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { authConfig } from "@/config/auth.config";

/**
 * Expõe o JWT da API (httpOnly) para o cliente conectar no WebSocket.
 * Só disponível com sessão autenticada.
 */
export async function GET() {
  try {
    const store = await cookies();
    const token = store.get(authConfig.cookies.apiAccessToken)?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 },
      );
    }
    return NextResponse.json({ success: true, data: { token } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno",
      },
      { status: 500 },
    );
  }
}
