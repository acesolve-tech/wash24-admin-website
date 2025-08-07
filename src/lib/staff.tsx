import { db } from "@/config/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

export async function fetchUsersByRole(
  role: string = "Staff",
  location?: string
) {
  try {
    const usersRef = collection(db, "users");
    const conditions = [where("role", "==", role)];

    if (location) {
      conditions.push(where("location", "==", location));
    }

    const q = query(usersRef, ...conditions); 
    const querySnapshot = await getDocs(q);

    const users = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        name: data.name || "Unknown",
        ...data,
      };
    });

    return {
      success: true,
      data: users,
      message: "Pengambilan Data Karyawan Berhasil",
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.message || "Pengambilan Data Karyawan Gagal",
    };
  }
}

export async function addOrUpdateUser(userId: string | null, data: any) {
  try {
    if (!userId) {
      const docRef = await addDoc(collection(db, "users"), data);

      return {
        success: true,
        data: { id: docRef.id },
        message: "User baru berhasil ditambahkan",
      };
    }

    await setDoc(doc(db, "users", userId), data, {
      merge: true,
    });
    return {
      success: true,
      data: null,
      message: "Data user berhasil disimpan",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Terjadi kesalahan, silakan coba lagi",
    };
  }
}

export async function removeUser(userId: string) {
  try {
    if (!userId) {
      return {
        success: false,
        data: null,
        message: "UserID tidak ditemukan",
      };
    }

    await deleteDoc(doc(db, "users", userId));
    return {
      success: true,
      data: null,
      message: "Data user berhasil dihapus",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Terjadi kesalahan, silakan coba lagi",
    };
  }
}
