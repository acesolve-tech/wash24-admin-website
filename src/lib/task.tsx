import { db, storage } from "@/config/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";

export async function fetchTask() {
  try {
    const otpQuery = query(collection(db, "tasks"), orderBy("order", "asc"));
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

export async function addTask(
  title: string,
  description: string,
  note: string,
  photo: string | null
) {
  try {
    let photoURL = "";

    if (photo) {
      const photoRef = ref(storage, `tasks/${Date.now()}.jpg`);
      await uploadString(photoRef, photo, "data_url");
      photoURL = await getDownloadURL(photoRef);
    }

    const docRef = await addDoc(collection(db, "tasks"), {
      title,
      description,
      note,
      photo: photoURL,
      status: false,
      order: -1,
    });

    return {
      success: true,
      data: { id: docRef.id },
      message: "Tugas baru berhasil ditambahkan",
    };
  } catch (error) {
    console.error("Error adding task:", error);
    return {
      success: false,
      data: null,
      message: "Tugas gagal disimpan",
    };
  }
}

export async function updateTask(
  id: string,
  updatedFields: {
    title?: string;
    description?: string;
    note?: string;
    photo?: string | null;
  }
) {
  try {
    let updatedPhotoURL = updatedFields.photo;

    if (updatedFields.photo?.startsWith("data:image")) {
      const photoRef = ref(storage, `tasks/${Date.now()}.jpg`);
      await uploadString(photoRef, updatedFields.photo, "data_url");
      updatedPhotoURL = await getDownloadURL(photoRef);
    }

    await setDoc(
      doc(db, "tasks", id),
      {
        ...updatedFields,
        ...(updatedPhotoURL && { photo: updatedPhotoURL }),
      },
      { merge: true }
    );

    return {
      success: true,
      data: null,
      message: "Tugas berhasil diupdate",
    };
  } catch (error) {
    console.error("Error updating task:", error);
    return {
      success: false,
      data: null,
      message: "Gagal mengupdate tugas",
    };
  }
}

export async function updateOrder(orderedIds: string[]) {
  try {
    const updates = orderedIds.map((taskId, index) => {
      const taskRef = doc(db, "tasks", taskId);
      return updateDoc(taskRef, { order: index });
    });

    await Promise.all(updates);

    return {
      success: true,
      data: null,
      message: "Order updated successfully",
    };
  } catch (error) {
    console.error("Failed to update task order:", error);
    return {
      success: false,
      data: null,
      message: "Gagal memperbarui urutan tugas",
    };
  }
}

export async function deleteTask(id: string) {
  try {
    await deleteDoc(doc(db, "tasks", id));
    return {
      success: true,
      data: null,
      message: "Tugas berhasil dihapus",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Gagal menghapus tugas",
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
