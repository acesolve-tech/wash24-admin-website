import { db } from "@/config/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import xlsx, { IJsonSheet } from "json-as-xlsx";

function formatDate(dateString: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-ID");
}

function formatTime(time: string) {
  return time || "-";
}

export async function downloadDeliveryToExcel(
  year: number,
  month: number,
  collectionName: string | undefined
) {
  if (collectionName === undefined) return;
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const DeliveryCollection = collection(db, `delivery-${collectionName}`);
  const DeliveryQuery = query(
    DeliveryCollection,
    where("finish_date", ">=", startDate),
    where("finish_date", "<=", endDate), 
    orderBy("finish_date")
  );

  const querySnapshot = await getDocs(DeliveryQuery);
  let data = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })); 

  const sheet: IJsonSheet = {
    sheet: `Delivery ${month}-${year}`,
    content: data,
    columns: [
      { label: "Name", value: "name" },
      { label: "Phone", value: "phone" },
      { label: "Status", value: "status" },
      { label: "Type", value: "type" },
      { label: "Driver", value: "driver" },
      { label: "Note", value: "note" },
      {
        label: "Finish Date",
        value: (row) => formatDate(String(row.finish_date)),
      },
      {
        label: "Finish Time",
        value: (row) => formatTime(String(row.finish_time)),
      },
    ],
  };

  const settings = {
    fileName: `Delivery Report (${month}-${year})`,
  };

  xlsx([sheet], settings);
}
