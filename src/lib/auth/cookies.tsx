"use server";

import { cookies } from "next/headers";

export async function setCookies(name: string, value: string) {
  try {
    const cookieStore = await cookies();

    cookieStore.set(name, value, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, data: null, message: "Cookies Set Successfully" };
  } catch (error: any) {
    return { success: false, data: null, message: "Failed to Set Cookies" };
  }
} 
 