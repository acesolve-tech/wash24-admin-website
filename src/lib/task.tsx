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

export async function fetchTask() {
  try {
    const otpQuery = query(collection(db, "tasks"));
    const querySnapshot = await getDocs(otpQuery);

    const otps = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return {
      success: true,
      data: otps,
      message: "Data Tasks berhasil diambil",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data Tasks gagal diambil",
    };
  }
}

export async function addTask(task: string) {
  try {
    const docRef = await addDoc(collection(db, "tasks"), {
      task,
      status: false,
    });

    return {
      success: true,
      data: { id: docRef.id },
      message: "Tugas baru berhasil ditambahkan",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Tugas gagal disimpan",
    };
  }
}

export async function toggleTask(id: string, status: boolean) {
  try {
    await setDoc(
      doc(db, "tasks", id),
      { status },
      {
        merge: true,
      }
    );
    return {
      success: true,
      data: null,
      message: "Data task berhasil diupdate",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data task gagal diupdate",
    };
  }
}

export async function clearCompletedTasks() {
  try {
    const completedQuery = query(
      collection(db, "tasks"),
      where("status", "==", true)
    );

    const querySnapshot = await getDocs(completedQuery);

    const deletePromises = querySnapshot.docs.map((docItem) =>
      deleteDoc(doc(db, "tasks", docItem.id))
    );

    await Promise.all(deletePromises);

    return {
      success: true,
      data: null,
      message: "Tugas yang selesai berhasil dihapus",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Gagal menghapus tugas yang selesai",
    };
  }
}
