"use server";

import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";

export async function decodeToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return {
        success: false,
        data: null,
        message: "Token not found in cookies",
      };
    }

    const decoded = jwt.decode(token) as JwtPayload;

    return {
      success: true,
      data: decoded,
      message: "Token decoded successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: "Failed to decode token",
    };
  }
}
