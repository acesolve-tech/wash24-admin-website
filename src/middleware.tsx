import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccessPath, getHomePath, UNAUTHORIZED_PATH } from "@/config/access";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const redirectTo = (request: NextRequest, path: string) =>
  NextResponse.redirect(new URL(path, request.url));

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    const response =
      pathname === "/" ? NextResponse.next() : redirectTo(request, "/");
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (pathname === "/") {
    return redirectTo(request, getHomePath(session));
  }

  if (pathname === UNAUTHORIZED_PATH) {
    return NextResponse.next();
  }

  if (!canAccessPath(pathname, session)) {
    return redirectTo(request, UNAUTHORIZED_PATH);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/unauthorized",
    "/attendance",
    "/attendance-report",
    "/staff",
    "/otp",
    "/task",
    "/delivery/:path*",
    "/delivery-history/:path*",
    "/production/:path*",
    "/cash-report/:path*",
    "/stock/:path*",
    "/app-services",
    "/app-customers/:path*",
  ],
};