import { auth, db } from "@/config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { setCookies } from "./cookies";
import { setJWT } from "./jwt";

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
      email: userCredential.user.email,
      name: userData.name || "",
      role: userData.role || "Staff",
      location: userData.location || "",
    };
    const token = (await setJWT(payload))?.data || ""; 

    await setCookies("token", token);

    return {
      success: true,
      data: { uid, ...userData },
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
