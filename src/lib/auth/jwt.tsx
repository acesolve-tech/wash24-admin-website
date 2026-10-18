"use server";

import { createSessionToken, SessionPayload } from "./session";

export async function setJWT(payload: SessionPayload) {
  try {
    const token = await createSessionToken(payload);
    if (!token) {
      return { success: false, data: null, message: "JWT SECRET not found" };
    }
    return {
      success: true,
      data: token,
      message: "JWT Token Created Successfully"
    };
  } catch (error) {
    console.error("setJWT:", error);
    return {
      success: false,
      data: null,
      message: "Failed to Create JWT Token"
    };
  }
}