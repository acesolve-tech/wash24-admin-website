import { db } from "@/config/firebase";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";

export async function saveStock(id: string, data: any) {
  try {
    const stockDocRef = doc(db, "stocks", id);
    await setDoc(stockDocRef, {
      data: data,
      lastUpdate: serverTimestamp(),
    });

    return {
      success: true,
      data: null,
      message: "Data stok berhasil disimpan",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data stok gagal disimpan",
    };
  }
}

export async function fetchStock(id: string) {
  try {
    const stockDocRef = doc(db, "stocks", id);
    const stockDocSnap = await getDoc(stockDocRef);

    if (stockDocSnap.exists()) {
      const data = stockDocSnap.data();
      const stockArray = Array.isArray(data.data) ? data.data : [];
      return {
        success: true,
        data: {
          stockData: stockArray,
          lastUpdate: data.lastUpdate,
        },
        message: "Data stok berhasil diambil",
      };
    }
    return {
      success: false,
      data: null,
      message: "Data stok kosong",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data stok gagal diambil",
    };
  }
} 

export async function cloneCollection(source: string, target: string) {
  try {
    console.log("MASUK")
    const snapshot = await getDocs(collection(db, source));
    const promises = snapshot.docs.map((docSnap) =>
      setDoc(doc(db, target, docSnap.id), docSnap.data())
    );
    await Promise.all(promises);
    console.log(`Cloned ${snapshot.size} documents from ${source} to ${target}`);
    return { success: true };
  } catch (error) {
    console.error("Error cloning collection:", error);
    return { success: false, error };
  }
}