"use server";

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || "";

export async function setJWT(payload: any) {
  if (!JWT_SECRET) {
    return { success: false, data: null, message: "JWT SECRET not found" };
  }
 
  try {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    return {
      success: true,
      data: token,
      message: "JWT Token Create Successfully",
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: "Failed to Create JWT Token",
    };
  }
}
