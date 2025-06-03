import { db } from "@/config/firebase";
import {
  Timestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import * as XLSX from "xlsx";

async function getProductionsByRegion(
  region: string,
  startDate: string,
  endDate: string
) {
  const productionsCollection = collection(db, `productions-${region}`);
  const q = query(
    productionsCollection,
    where("created_date", ">=", startDate),
    where("created_date", "<=", endDate)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

function formatTimestamp(ts: any) {
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
  const month = String(date.getMonth() + 1).padStart(2, "0"); // months are zero-based
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month} - ${hours}.${minutes}`;
}

export async function downloadProductionToExcel(
  startDate: string,
  endDate: string,
  region: string
) {
  const productions = await getProductionsByRegion(region, startDate, endDate);

  const formattedData = productions.map((prod) => ({
    created_date: prod.created_date || "-",
    customer_name: prod.customer_name || "-",
    nota: prod.production_staff?.nota || "-",
    nota_timestamp: formatTimestamp(prod.production_staff?.nota_timestamp),
    cuci: prod.production_staff?.cuci || "-",
    cuci_timestamp: formatTimestamp(prod.production_staff?.cuci_timestamp),
    kering: prod.production_staff?.kering || "-",
    kering_timestamp: formatTimestamp(prod.production_staff?.kering_timestamp),
    setrika: prod.production_staff?.setrika || "-",
    setrika_timestamp: formatTimestamp(
      prod.production_staff?.setrika_timestamp
    ),
    packing: prod.production_staff?.packing || "-",
    packing_timestamp: formatTimestamp(
      prod.production_staff?.packing_timestamp
    ),
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Productions");

  XLSX.writeFile(
    workbook,
    `Productions_${region}_${startDate}_to_${endDate}.xlsx`
  );
}
