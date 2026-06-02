import { db } from "@/config/firebase";
import { Production } from "@/types/production";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import * as XLSX from "xlsx";

export async function fetchProduction(
  selectedDate: Date,
  collectionName: string
) {
  console.log(collectionName, selectedDate);
  try {
    if (selectedDate) {
      const today = selectedDate;
      const formattedDate = `${today?.getFullYear()}-${(today?.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${today?.getDate().toString().padStart(2, "0")}`;

      const userQuerySnapshot = await getDocs(
        query(
          collection(db, `productions-${collectionName}`),
          where("created_date", "==", formattedDate),
          orderBy("created_date", "asc")
        )
      );
      const fetcedProduction = userQuerySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Production[];

      return {
        success: true,
        data: fetcedProduction,
        message: "Data produksi berhasil diambil",
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Data produksi gagal diambil",
    };
  }
}

function formatTimestamp(ts: any): string {
  if (!ts) return "-";
  let date: Date;
  if (ts.toDate) {
    date = ts.toDate();
  } else if (ts instanceof Date) {
    date = ts;
  } else {
    return "-";
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month} - ${hours}.${minutes}`;
}

export async function downloadProductionMonthlyToExcel(
  yearMonth: string,
  collectionName: string
) {
  const [year, month] = yearMonth.split("-").map(Number);
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const querySnapshot = await getDocs(
    query(
      collection(db, `productions-${collectionName}`),
      where("created_date", ">=", startDate),
      where("created_date", "<=", endDate),
      orderBy("created_date", "asc")
    )
  );

  const productions = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const steps = ["pickup", "nota", "cuci", "kering", "setrika", "lipat", "packing", "delivery"];
  const stepLabels: Record<string, string> = {
    pickup: "Pick Up",
    nota: "Nota",
    cuci: "Cuci",
    kering: "Kering",
    setrika: "Setrika",
    lipat: "Lipat",
    packing: "Packing",
    delivery: "Delivery",
  };

  // staffName -> date -> step -> count
  const staffMap = new Map<string, Map<string, Record<string, number>>>();

  for (const prod of productions) {
    const ps = (prod as any).production_staff || {};
    const date = (prod as any).created_date || "";

    for (const step of steps) {
      const staffName = ps[step];
      if (!staffName) continue;

      if (!staffMap.has(staffName)) staffMap.set(staffName, new Map());
      const dateMap = staffMap.get(staffName)!;

      if (!dateMap.has(date)) {
        dateMap.set(date, Object.fromEntries(steps.map((s) => [s, 0])));
      }
      dateMap.get(date)![step] += 1;
    }
  }

  // All dates in the month, no gaps
  const allDates: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    allDates.push(
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }

  const workbook = XLSX.utils.book_new();

  if (staffMap.size === 0) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([]),
      "Tidak Ada Data"
    );
  } else {
    for (const [staffName, dateMap] of staffMap) {
      const rows = allDates.map((date) => {
        const counts =
          dateMap.get(date) ?? Object.fromEntries(steps.map((s) => [s, 0]));
        const row: Record<string, string | number> = { Tanggal: date };
        for (const step of steps) {
          row[stepLabels[step]] = counts[step] ?? 0;
        }
        return row;
      });

      const sheetName = staffName
        .replace(/[:\\/?\*\[\]]/g, "_")
        .substring(0, 31);
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(rows),
        sheetName
      );
    }
  }

  XLSX.writeFile(workbook, `Produksi_${collectionName}_${yearMonth}.xlsx`);
}
