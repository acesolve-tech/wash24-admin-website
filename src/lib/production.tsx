import { db } from "@/config/firebase";
import { Production } from "@/types/production";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

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
