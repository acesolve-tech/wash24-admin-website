import { db } from "@/config/firebase";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export async function sendOtp(email: string) {
  try {
    const otp = generateOtp();
    await addDoc(collection(db, "OTP"), {
      otp,
      email: email,
      createdAt: serverTimestamp(),
    });

    return { success: true, data: otp, message: "OTP Successfully Send" };
  } catch (error: any) {
    return { success: false, data: null, message: "Failed to Send OTP" };
  }
}

export async function getLatestOtp(email: string) {
  try {
    const otpQuery = query(
      collection(db, "OTP"),
      where("email", "==", email),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(otpQuery);
    if (querySnapshot.empty)
      return { success: false, data: null, message: "No OTP Found" };

    const latestOtp = querySnapshot.docs[0];
    console.log(latestOtp.data());
    const otpData = latestOtp.data();

    const now = new Date().getTime();
    const createdAt = otpData.createdAt?.toDate()?.getTime();
    const isExpired = createdAt ? (now - createdAt) / 1000 > 3600 : true;

    return {
      success: true,
      data: {
        id: latestOtp.id,
        otpCode: latestOtp.data().otp,
        status: isExpired ? "expired" : "valid",
      },
      message: "Success Fetch Latest OTP",
    };
  } catch (error: any) {
    console.log(error.message);
    return {
      success: false,
      data: null,
      message: "Failed to fetch latest OTP",
    };
  }
}
