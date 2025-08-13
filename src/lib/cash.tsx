import { db, storage } from "@/config/firebase";
import { Cash } from "@/types/cash";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";

export async function fetchCash(collectionName: string) {
  try {
    const cashQuerySnapshot = await getDocs(
      query(
        collection(db, `cash-${collectionName}`),
        orderBy("date", "asc")
      )
    );

    const fetchedCash = cashQuerySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Cash[];

    let runningTotal = 0;
    const updatedCash = fetchedCash.map((cash) => {
      const income = cash.income ? +cash.income : 0;
      const expense = cash.expense ? +cash.expense : 0;
      runningTotal += income - expense;
      return {
        ...cash,
        currentTotal: runningTotal,
      };
    });

    const totalIncome = fetchedCash.reduce((acc, cash) => {
      return acc + (cash.income ? +cash.income : 0);
    }, 0);

    const totalExpense = fetchedCash.reduce((acc, cash) => {
      return acc + (cash.expense ? +cash.expense : 0);
    }, 0);

    return {
      success: true,
      data: {
        total: totalIncome - totalExpense,
        cash: updatedCash.reverse(),
      },
      message: "Data kas gagal diambil",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data kas berhasil diambil",
    };
  }
} 

const convertBase64ToFirebase = async (photo: string) => {
  if (!photo?.startsWith("data:image")) {
    return null;
  }

  const imageRef = ref(storage, `images/${Date.now()}.png`);

  try {
    await uploadString(imageRef, photo, "data_url");
    const imageUrl = await getDownloadURL(imageRef);
    return imageUrl;
  } catch (error) {
    return null;
  }
};

export async function addCash(
  photo: string,
  collectionName: string,
  cashType: string,
  amount: number,
  information: string
) {
  try {
    const imageUrl = await convertBase64ToFirebase(photo);
    const docRef = await addDoc(
      collection(db, `cash-${collectionName}`),
      {
        date: new Date(),
        [cashType]: amount,
        information,
        note: imageUrl,
      }
    );

    return {
      success: true,
      data: null,
      message: "Data kas berhasil ditambahkan",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data kas gagal ditambahkan",
    };
  }
}

export async function updateCash(
  collectionName: string,
  selecedId: string,
  information: string,
  newCashType: string,
  amount: number,
  photo: string,
  originalCashType: "income" | "expense"
) {
  try {
    const updateObjectWithID: any = {
      information: information,
      [newCashType]: amount,
      ...(photo && { note: photo }),
    };

    if (newCashType !== originalCashType) {
      updateObjectWithID[originalCashType] = deleteField();
    }
    const newCashDocRef = doc(
      db,
      `cash-${collectionName}`,
      selecedId
    );
    await setDoc(newCashDocRef, updateObjectWithID, { merge: true });
    return {
      success: true,
      data: null,
      message: "Data kas berhasil diubah",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data kas gagal diubah",
    };
  }
}

export async function deleteCash(
  collectionName: string,
  selecedId: string
) {
  try {
    const deliveryDocRef = doc(db, `cash-${collectionName}`, selecedId);
    await deleteDoc(deliveryDocRef);
    return {
      success: true,
      data: null,
      message: "Data kas berhasil dihapus",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data kas gagal dihapus",
    };
  }
}
