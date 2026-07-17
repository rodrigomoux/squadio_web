import { NextResponse } from "next/server";
import { z } from "zod";

import { setAuthCookies } from "@/lib/auth/cookies";
import { AuthService } from "@/services/auth/AuthService";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const credentials = loginSchema.parse(body);

    const backendResponse =
      await AuthService.authenticateWithBackend(credentials);

    const encryptedTokens = await AuthService.createEncryptedTokens(
      backendResponse.user,
    );

    await setAuthCookies(
      encryptedTokens.accessToken,
      encryptedTokens.refreshToken,
      {
        accessToken: backendResponse.accessToken,
        refreshToken: backendResponse.refreshToken,
      },
    );

    return NextResponse.json({
      user: backendResponse.user,
      // JWT da API — o cliente usa no Authorization nas chamadas ao backend
      accessToken: backendResponse.accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Erro ao realizar login";

    return NextResponse.json({ message }, { status: 401 });
  }
}
