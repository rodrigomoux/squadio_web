import { NextResponse } from "next/server";
import { z } from "zod";

import type { ApiEnvelope } from "@/lib/auth/types";
import { apiClient } from "@/services/api/ApiClient";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const envelope = await apiClient.post<ApiEnvelope<{ message: string }>>(
      "/auth/confirm",
      body,
    );

    if (!envelope?.success) {
      return NextResponse.json(
        { message: envelope?.error ?? "Falha na confirmação" },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: envelope.data.message });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro" },
      { status: 400 },
    );
  }
}
