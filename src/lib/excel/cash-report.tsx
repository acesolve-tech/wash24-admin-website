import { db } from "@/config/firebase";
import { collection, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import xlsx, { IJsonSheet } from "json-as-xlsx";

function formatDate(date: Date | null) {
  if (!date) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export async function downloadCashReportRangeToExcel(
  startDate: string,
  endDate: string,
  collectionName: string | undefined
) {
  if (!collectionName || !startDate || !endDate) return;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59.999`);

  const cashReportCollection = collection(db, `cash-report-${collectionName}`);
  const cashReportQuery = query(cashReportCollection, orderBy("date", "asc"));

  const querySnapshot = await getDocs(cashReportQuery);
  const allRows = querySnapshot.docs.map((doc) => {
    const raw = doc.data() as any;
    const income = raw.income ? +raw.income : 0;
    const expense = raw.expense ? +raw.expense : 0;
    const date = raw.date instanceof Timestamp ? raw.date.toDate() : null;
    return {
      id: doc.id,
      date,
      information: raw.information ?? "",
      income,
      expense,
      note: raw.note ?? "",
    };
  });

  let runningTotal = 0;
  const withRunningTotal = allRows.map((row) => {
    runningTotal += row.income - row.expense;
    return {
      ...row,
      income: Math.round(row.income),
      expense: Math.round(row.expense),
      currentTotal: Math.round(runningTotal),
    };
  });

  const inRange = withRunningTotal.filter(
    (row) => row.date && row.date >= start && row.date <= end
  );

  const rangeIncome = inRange.reduce((acc, r) => acc + r.income, 0);
  const rangeExpense = inRange.reduce((acc, r) => acc + r.expense, 0);

  const data: Array<(typeof inRange)[number]> = [...inRange];
  data.push({
    id: "",
    date: null,
    information: "TOTAL (Rentang)",
    income: rangeIncome,
    expense: rangeExpense,
    note: "",
    currentTotal: Math.round(runningTotal),
  });

  const sheet: IJsonSheet = {
    sheet: `Kas ${startDate} - ${endDate}`,
    content: data,
    columns: [
      { label: "Tanggal", value: (row) => formatDate(row.date as Date | null) },
      { label: "Informasi", value: "information" },
      { label: "Tunai Masuk", value: "income" },
      { label: "Tunai Keluar", value: "expense" },
      { label: "Total Tunai", value: "currentTotal" },
      { label: "Nota", value: "note" },
    ],
  };

  const settings = {
    fileName: `Laporan Tunai ${collectionName} (${startDate} to ${endDate})`,
  };

  xlsx([sheet], settings);
}
