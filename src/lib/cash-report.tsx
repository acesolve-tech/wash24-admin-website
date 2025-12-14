import { db, storage } from "@/config/firebase";
import { CashReport } from "@/types/cash-report";
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

export async function fetchCashReport(collectionName: string) {
  try {
    const cashReportQuerySnapshot = await getDocs(
      query(
        collection(db, `cash-report-${collectionName}`),
        orderBy("date", "asc")
      )
    );

    const fetchedCashReport = cashReportQuerySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CashReport[];

    let runningTotal = 0;
    const updatedCashReport = fetchedCashReport.map((report) => {
      const income = report.income ? +report.income : 0;
      const expense = report.expense ? +report.expense : 0;
      runningTotal += income - expense;
      return {
        ...report,
        currentTotal: runningTotal,
      };
    });

    const totalIncome = fetchedCashReport.reduce((acc, report) => {
      return acc + (report.income ? +report.income : 0);
    }, 0);

    const totalExpense = fetchedCashReport.reduce((acc, report) => {
      return acc + (report.expense ? +report.expense : 0);
    }, 0);

    return {
      success: true,
      data: {
        total: totalIncome - totalExpense,
        cashReport: updatedCashReport.reverse(),
      },
      message: "Data cash report gagal diambil",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data cash report berhasil diambil",
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

export async function addCashReport(
  photo: string,
  collectionName: string,
  cashType: string,
  amount: number,
  information: string
) {
  try {
    const imageUrl = await convertBase64ToFirebase(photo);
    await addDoc(collection(db, `cash-report-${collectionName}`), {
      date: new Date(),
      [cashType]: amount,
      information,
      note: imageUrl,
    });

    return {
      success: true,
      data: null,
      message: "Data cash report berhasil ditambahkan",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data cash report gagal ditambahkan",
    };
  }
}

export async function updateCashReport(
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
    const newCashReportDocRef = doc(
      db,
      `cash-report-${collectionName}`,
      selecedId
    );
    await setDoc(newCashReportDocRef, updateObjectWithID, { merge: true });
    return {
      success: true,
      data: null,
      message: "Data cash report berhasil diubah",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data cash report gagal diubah",
    };
  }
}

export async function deleteCashReport(
  collectionName: string,
  selecedId: string
) {
  try {
    const deliveryDocRef = doc(db, `cash-report-${collectionName}`, selecedId);
    await deleteDoc(deliveryDocRef);
    return {
      success: true,
      data: null,
      message: "Data cash report berhasil dihapus",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data cash report gagal dihapus",
    };
  }
}
