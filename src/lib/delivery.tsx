import { db } from "@/config/firebase";
import { Delivery } from "@/types/delivery";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

export async function addDelivery(collectionName: string, data: any) {
  try {
    await addDoc(collection(db, `delivery-${collectionName}`), data);

    return {
      success: true,
      data: null,
      message: "Data delivery berhasil ditambahkan",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data delivery gagal ditambahkan",
    };
  }
}

export async function saveDelivery(
  collectionName: string,
  idDelivery: string,
  data: any
) {
  try {
    const docRef = doc(db, `delivery-${collectionName}`, idDelivery);
    await setDoc(docRef, data, { merge: true });
    return {
      success: true,
      data: null,
      message: "Data delivery berhasil disimpan",
    };
  } catch (error) {
    return {
      success: true,
      data: null,
      message: "Data delivery gagal disimpan",
    };
  }
}

export async function finishOrCancelDelivery(
  collectionName: string,
  idDelivery: string,
  actionType: string,
  driver: string
) {
  try {
    const deliveryDocRef = doc(db, `delivery-${collectionName}`, idDelivery);
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    const formattedTime = `${today
      .getHours()
      .toString()
      .padStart(2, "0")}:${today.getMinutes().toString().padStart(2, "0")}`;

    await updateDoc(deliveryDocRef, {
      status: actionType,
      driver: driver ? driver : "",
      finish_date: formattedDate,
      finish_time: formattedTime,
    });
    return {
      success: true,
      data: null,
      message: "Data delivery berhasil diubah",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data delivery gagal diubah",
    };
  }
}

export async function fetchDelivery(
  selectedDate: Date,
  collectionName: string
) {
  try {
    const formattedDate = `${selectedDate?.getFullYear()}-${(
      selectedDate?.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${selectedDate
      ?.getDate()
      .toString()
      .padStart(2, "0")}`;
    const userQuerySnapshot = await getDocs(
      query(
        collection(db, `delivery-${collectionName}`),
        where("finish_date", "==", formattedDate)
      )
    );
    const fetchedDelivery = userQuerySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Delivery[];

    return {
      success: true,
      data: fetchedDelivery,
      message: "Data delivery berhasil diambil",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data delivery gagal diambil",
    };
  }
}
