import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthService } from "@/services/auth/AuthService";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(4),
  newPassword: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    await AuthService.resetPassword(body);
    return NextResponse.json({ message: "Senha atualizada" });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro" },
      { status: 400 },
    );
  }
}
