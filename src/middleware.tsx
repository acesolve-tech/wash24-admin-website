import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ROUTE_PERMISSIONS } from "@/constants"; 

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  let userRole = "";
  let isAuthenticated = false;

  if (token) {
    try {
      const decoded = jwt.decode(token) as JwtPayload | null;
      if (decoded && decoded.role) {
        userRole = decoded.role;
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
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
    "/attendance",
    "/attendance-report",
    "/staff",
    "/otp",
    "/delivery/:path*",
    "/production/:path*",
    "/cash-report/:path*",
    "/stock/:path*",
  ],
};
