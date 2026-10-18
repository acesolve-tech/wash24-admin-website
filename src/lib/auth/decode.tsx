"use server";

import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export async function decodeToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return {
        success: false,
        data: null,
        message: "Token not found in cookies",
      };
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return {
        success: false,
        data: null,
        message: "Token tidak valid atau sudah kedaluwarsa",
      };
    }

    return {
      success: true,
      data: session,
      message: "Token decoded successfully",
    };
  } catch (error) {
    console.error("decodeToken:", error);
    return {
      success: false,
      data: null,
      message: "Failed to decode token",
    };
  }
}