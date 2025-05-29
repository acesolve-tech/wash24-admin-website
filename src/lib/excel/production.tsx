 
import { db } from "@/config/firebase";
import { Timestamp, collection, getDocs, query, where } from "firebase/firestore";
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
    cuci: prod.production_staff?.cuci || "-",
    kering: prod.production_staff?.kering || "-",
    setrika: prod.production_staff?.setrika || "-",
    packing: prod.production_staff?.packing || "-",
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Productions");

  XLSX.writeFile(
    workbook,
    `Productions_${region}_${startDate}_to_${endDate}.xlsx`
  );
}
