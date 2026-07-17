import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authConfig } from "@/config/auth.config";
import { decryptJwt } from "@/lib/auth/jwt";

const publicRoutes: string[] = [...authConfig.routes.public];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(
    authConfig.cookies.accessToken,
  )?.value;

  let isAuthenticated = false;

  if (accessToken) {
    try {
      const payload = await decryptJwt(accessToken);
      isAuthenticated = payload.type === "access";
    } catch {
      isAuthenticated = false;
    }
  }

  const isPublicRoute = publicRoutes.includes(pathname);
  const isLoginRoute = pathname === authConfig.routes.login;

  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL(authConfig.routes.login, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isLoginRoute) {
    return NextResponse.redirect(
      new URL(authConfig.routes.dashboard, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
