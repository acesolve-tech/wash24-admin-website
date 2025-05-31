import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ROUTE_PERMISSIONS } from "@/constants";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  let userRole = "";
  let userLocation = "";
  let isAuthenticated = false;

  if (token) {
    try {
      const decoded = jwt.decode(token) as JwtPayload | null;
      if (decoded && decoded.role) {
        userRole = decoded.role;
        userLocation = decoded.location.toLowerCase();
        isAuthenticated = true;
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } else {
    if (pathname === "/") {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  } else if (isAuthenticated && pathname === "/") {
    let locationPath = "";

    if (userLocation === "malang") {
      locationPath = "/delivery/mlg";
    } else if (userLocation === "surabaya") {
      locationPath = "/delivery/sby";
    } else if (userLocation === "surabaya-2") {
      locationPath = "/delivery/sby2";
    } else if (userLocation === "surabaya-3") {
      locationPath = "/delivery/sby3";
    } else if (userLocation === "jakarta" || userLocation === "jakarta-3") {
      locationPath = "/delivery/jkt3";
    }

    if (locationPath) {
      return NextResponse.redirect(new URL(locationPath, request.url));
    }

    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  const matched = ROUTE_PERMISSIONS.find(({ path }) => path === pathname);

  if (!matched) {
    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  if (!matched.role || matched.role.length === 0) {
    return NextResponse.next();
  }

  if (!matched.role.includes(userRole)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/attendance",
    "/attendance-report",
    "/staff",
    "/otp",
    "/task",
    "/delivery/:path*",
    "/production/:path*",
    "/cash-report/:path*",
    "/stock/:path*",
  ],
};
