"use server"; 
import { cookies } from "next/headers";

export async function logout() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("token", "", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: -1,
    });

    return {
      success: true,
      data: null,
      message: "Logout sukses",
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: "Logout gagal",
    };
  }
}
