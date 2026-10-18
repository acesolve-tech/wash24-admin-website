import { auth, db } from "@/config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { setCookies } from "./cookies";
import { setJWT } from "./jwt";
import { User } from "@/types/user";

export async function login(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const uid = userCredential.user.uid;
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return { success: false, data: null, message: "User data not found" };
    }

    const userData = userDocSnap.data();
    const payload = {
      uid,
      email: userCredential.user.email ?? email,
      name: userData.name || "",
      role: userData.role || "Staff",
      location: userData.location || "",
    };
    const jwtResult = await setJWT(payload);
    if (!jwtResult.success || !jwtResult.data) {
      return { success: false, data: null, message: jwtResult.message };
    }

    await setCookies("token", jwtResult.data);

    return {
      success: true,
      data: { uid, ...userData } as User,
      message: "Login successful",
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.message || "Login failed",
    };
  }
}