import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ROUTE_PERMISSIONS } from "@/constants";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  let userRole = "";
  let userLocation = "";
  let userEmail = "";
  let isAuthenticated = false;

  if (token) {
    try {
      const decoded = jwt.decode(token) as JwtPayload | null;
      if (decoded && decoded.role) {
        userRole = decoded.role;
        userEmail = decoded.email;
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
      if (userEmail?.startsWith("sbypusat")) {
        locationPath = "/delivery/sby";
      } else if (userEmail?.startsWith("sbybarat")) {
        locationPath = "/delivery/sby2";
      } else if (userEmail?.startsWith("sbytimur")) {
        locationPath = "/delivery/sby3";
      } else if (userEmail?.startsWith("sbyselatan")) {
        locationPath = "/delivery/sby4";
      } else {
        locationPath = "/delivery/sby";
      }
    } else if (userLocation === "jakarta") {
      if (userEmail?.startsWith("jktselatan")) {
        locationPath = "/delivery/jkt3";
      } else { 
        locationPath = "/delivery/jkt4";
      }
    }

    if (locationPath) {
      return NextResponse.redirect(new URL(locationPath, request.url));
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  const matched = ROUTE_PERMISSIONS.find(({ path }) => path === pathname);

  if (!matched) {
    return NextResponse.redirect(new URL("/", request.url));
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
