import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthService } from "@/services/auth/AuthService";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json());
    const result = await AuthService.forgotPassword(email);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro" },
      { status: 400 },
    );
  }
}
