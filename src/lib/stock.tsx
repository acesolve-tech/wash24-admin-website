import { db } from "@/config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";

export async function saveStock(id: string, newData: any[], oldData: any[]) {
  const itemsRef = collection(db, "stocks", id, "items");
  const logsRef = collection(db, "stocks", id, "logs");

  const ops: Promise<any>[] = [];

  newData.forEach((item, index) => {
    const oldItem = oldData[index];
    const itemRef = doc(itemsRef, item.id || crypto.randomUUID());

    ops.push(
      setDoc(itemRef, {
        name: item.name,
        stokAwal: item.stokAwal || 0,
        barangMasuk: item.barangMasuk || 0,
        barangKeluar: item.barangKeluar || 0,
        lastUpdated: serverTimestamp(),
      })
    );

    if (!oldItem) {
      const logRef = doc(logsRef);
      ops.push(
        setDoc(logRef, {
          itemId: itemRef.id,
          itemName: item.name,
          field: "created",
          oldValue: null,
          newValue: {
            stokAwal: item.stokAwal,
            barangMasuk: item.barangMasuk,
            barangKeluar: item.barangKeluar,
          },
          updatedBy: "admin",
          timestamp: serverTimestamp(),
        })
      );
      return;
    }

    const logIfChanged = (field: string, oldVal: any, newVal: any) => {
      if (oldVal === newVal) return;
      const logRef = doc(logsRef);
      ops.push(
        setDoc(logRef, {
          itemId: itemRef.id,
          itemName: item.name,
          field,
          oldValue: oldVal,
          newValue: newVal,
          updatedBy: "admin",
          timestamp: serverTimestamp(),
        })
      );
    };

    logIfChanged("name", oldItem.name, item.name);
    logIfChanged("stokAwal", oldItem.stokAwal, item.stokAwal);
    logIfChanged("barangMasuk", oldItem.barangMasuk, item.barangMasuk);
    logIfChanged("barangKeluar", oldItem.barangKeluar, item.barangKeluar);
  });

  await Promise.all(ops);
  return { success: true };
}

export async function fetchStock(id: string) {
  const q = query(
    collection(db, "stocks", id, "items"),
    orderBy("lastUpdated", "desc")
  );

  const snap = await getDocs(q);

  const items = snap.docs.map((d) => ({
    id: d.id,
    name: d.data().name || "",
    stokAwal: d.data().stokAwal || 0,
    barangMasuk: d.data().barangMasuk || 0,
    barangKeluar: d.data().barangKeluar || 0,
    lastUpdated: d.data().lastUpdated || null,
  }));

  return { success: true, data: items };
}

export async function fetchStockLogs(id: string) {
  try {
    const q = query(
      collection(db, "stocks", id, "logs"),
      orderBy("timestamp", "desc")
    );

    const logsSnap = await getDocs(q);

    const logs = logsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      data: logs,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      message: "Failed to fetch logs",
    };
  }
}
