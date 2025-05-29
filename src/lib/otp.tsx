import { db } from "@/config/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

export async function clearOldOtps() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfDay = today.getTime();

    const otpQuery = query(
      collection(db, "OTP"),
      where("createdAt", "<", new Date(startOfDay))
    );

    const querySnapshot = await getDocs(otpQuery);

    if (!querySnapshot.empty) {
      const deletePromises = querySnapshot.docs.map((docSnapshot) =>
        deleteDoc(doc(db, "OTP", docSnapshot.id))
      );

      await Promise.all(deletePromises);
      return {
        success: true,
        data: null,
        message: "Data OTP berhasil dihapus",
      };
    } else {
      return {
        success: false,
        data: null,
        message: "Data OTP gagal dihapus",
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data OTP gagal dihapus",
    };
  }
}

export async function fetchAllOtp() {
  try {
    const otpQuery = query(collection(db, "OTP"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(otpQuery);

    const otps = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return {
      success: true,
      data: otps,
      message: "Data OTP berhasil diambil",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data OTP gagal diambil",
    };
  }
}
