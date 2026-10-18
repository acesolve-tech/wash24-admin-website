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

export type CashType = "income" | "expense";

export const MAX_CASH_REPORT_PHOTOS = 2;

export type CashReportInput = {
  information: string;
  cashType: CashType;
  amount: number;
  photos: (string | null)[];
};

type CashReportResult = {
  success: boolean;
  data: null;
  message: string;
};

const PHOTO_UPLOAD_ERROR =
  "Foto gagal di-upload. Periksa koneksi internet lalu coba lagi.";

const succeeded = (message: string): CashReportResult => ({
  success: true,
  data: null,
  message,
});

const failed = (message: string): CashReportResult => ({
  success: false,
  data: null,
  message,
});

export function getCashReportPhotos(
  report: Partial<Pick<CashReport, "note" | "note_2">> | null | undefined
): string[] {
  return [report?.note, report?.note_2].filter(
    (value): value is string => typeof value === "string" && value.trim() !== ""
  );
}

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
      message: "Data tunai berhasil diambil",
    };
  } catch (error) {
    console.error("fetchCashReport:", error);
    return {
      success: false,
      data: null,
      message: "Data tunai gagal diambil",
    };
  }
}

const isNewPhoto = (value: string) => value.startsWith("data:image");

const uploadCashReportPhoto = async (dataUrl: string, index: number) => {
  const fileName = `${Date.now()}-${index + 1}-${Math.random()
    .toString(36)
    .slice(2, 8)}.jpg`;
  const imageRef = ref(storage, `images/${fileName}`);
  await uploadString(imageRef, dataUrl, "data_url");
  return getDownloadURL(imageRef);
};

const resolvePhotos = async (photos: (string | null)[]) => {
  const filled = photos
    .filter((photo): photo is string => !!photo)
    .slice(0, MAX_CASH_REPORT_PHOTOS);

  const urls = await Promise.all(
    filled.map((photo, index) =>
      isNewPhoto(photo) ? uploadCashReportPhoto(photo, index) : photo
    )
  );

  return { note: urls[0] ?? null, note_2: urls[1] ?? null };
};

const validateInput = (input: CashReportInput): string | null => {
  if (!input.information.trim()) return "Informasi wajib diisi.";
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return "Nominal harus lebih dari 0.";
  }
  return null;
};

export async function addCashReport(
  collectionName: string,
  input: CashReportInput
): Promise<CashReportResult> {
  const invalid = validateInput(input);
  if (invalid) return failed(invalid);

  let photos: Awaited<ReturnType<typeof resolvePhotos>>;
  try {
    photos = await resolvePhotos(input.photos);
  } catch (error) {
    console.error("addCashReport upload:", error);
    return failed(PHOTO_UPLOAD_ERROR);
  }

  try {
    await addDoc(collection(db, `cash-report-${collectionName}`), {
      date: new Date(),
      [input.cashType]: input.amount,
      information: input.information.trim(),
      ...photos,
    });
    return succeeded("Data tunai berhasil ditambahkan");
  } catch (error) {
    console.error("addCashReport:", error);
    return failed("Data tunai gagal ditambahkan. Silakan coba lagi.");
  }
}

export async function updateCashReport(
  collectionName: string,
  selectedId: string,
  input: CashReportInput,
  originalCashType: CashType
): Promise<CashReportResult> {
  const invalid = validateInput(input);
  if (invalid) return failed(invalid);

  let photos: Awaited<ReturnType<typeof resolvePhotos>>;
  try {
    photos = await resolvePhotos(input.photos);
  } catch (error) {
    console.error("updateCashReport upload:", error);
    return failed(PHOTO_UPLOAD_ERROR);
  }

  try {
    const updateObject: Record<string, unknown> = {
      information: input.information.trim(),
      [input.cashType]: input.amount,
      ...photos,
    };

    if (input.cashType !== originalCashType) {
      updateObject[originalCashType] = deleteField();
    }

    await setDoc(
      doc(db, `cash-report-${collectionName}`, selectedId),
      updateObject,
      { merge: true }
    );
    return succeeded("Data tunai berhasil diubah");
  } catch (error) {
    console.error("updateCashReport:", error);
    return failed("Data tunai gagal diubah. Silakan coba lagi.");
  }
}

export async function deleteCashReport(
  collectionName: string,
  selectedId: string
): Promise<CashReportResult> {
  try {
    await deleteDoc(doc(db, `cash-report-${collectionName}`, selectedId));
    return succeeded("Data tunai berhasil dihapus");
  } catch (error) {
    console.error("deleteCashReport:", error);
    return failed("Data tunai gagal dihapus. Silakan coba lagi.");
  }
}