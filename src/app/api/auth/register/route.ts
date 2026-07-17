import { NextResponse } from "next/server";
import { z } from "zod";

import type { ApiEnvelope } from "@/lib/auth/types";
import { apiClient } from "@/services/api/ApiClient";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["player", "court_owner", "admin"]).optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const envelope = await apiClient.post<
      ApiEnvelope<{
        user: unknown;
        message: string;
        confirmationCode?: string;
      }>
    >("/auth/register", body);

    if (!envelope?.success) {
      return NextResponse.json(
        { message: envelope?.error ?? "Falha no cadastro" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: envelope.data.message,
      confirmationCode: envelope.data.confirmationCode,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro" },
      { status: 500 },
    );
  }
}
