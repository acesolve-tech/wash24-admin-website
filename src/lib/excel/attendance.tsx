import { db } from "@/config/firebase";
import { User } from "@/types/user";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import xlsx, { IJsonSheet } from "json-as-xlsx";

function formatTimestamp(timestamp: Timestamp | null) {
  if (timestamp && timestamp instanceof Timestamp) {
    const { seconds, nanoseconds } = timestamp;
    const milliseconds = seconds * 1000 + nanoseconds / 1000000;
    const formattedDate = new Date(milliseconds);

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };

    const formatter = new Intl.DateTimeFormat("en-US", options);
    const formatted = formatter.format(formattedDate);

    const dateParts = formatted.split(", ")[0].split("/");
    const adjustedFormatted =
      formatted.split(", ")[1].replace(/^24/, "00") +
      " (" +
      dateParts[1] +
      "/" +
      dateParts[0] +
      "/" +
      dateParts[2] +
      ")";

    return adjustedFormatted;
  } else {
    return "-";
  }
}

async function getStaffNoKurir() {
  const userQuerySnapshot = await getDocs(
    query(collection(db, "users"), where("role", "==", "Staff"))
  );

  const fetchedPeople = userQuerySnapshot.docs
    .map((doc) => {
      const data = doc.data() as User;
      return { ...data, id: doc.id };
    })
    .filter((person) => !person.name.startsWith("Kurir"));

  return fetchedPeople;
}

export async function downloadToExcel(year: number, month: number) {
  const users = await getStaffNoKurir();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const columns: IJsonSheet[] = [];

  for (const user of users) {
    const { name } = user;
    const AttendanceCollection = collection(db, "attendance");
    const AttendanceQuery = query(
      AttendanceCollection,
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      where("name", "==", name)
    );

    const querySnapshot = await getDocs(AttendanceQuery);
    const data = querySnapshot.docs.map((doc) => doc.data());

    const syncedData = await Promise.all(data);

    columns.push({
      sheet: name.replace(/[\\/:*?[\]]/g, "_"),

      content: syncedData,
      columns: [
        {
          label: "Datang Kerja",
          value: (row) => {
            const { clock_in } = row as {
              clock_in?: Timestamp;
            };

            if (clock_in instanceof Timestamp) {
              return formatTimestamp(clock_in);
            }
            return "-";
          },
        },
        {
          label: "Pulang Kerja",
          value: (row) => {
            const { clock_out } = row as {
              clock_out?: Timestamp;
            };

            if (clock_out instanceof Timestamp) {
              return formatTimestamp(clock_out);
            }
            return "-";
          },
        },
        {
          label: "Istirahat Mulai",
          value: (row) => {
            const { rest_start } = row as {
              rest_start?: Timestamp;
            };

            if (rest_start instanceof Timestamp) {
              return formatTimestamp(rest_start);
            }
            return "-";
          },
        },
        {
          label: "Istirahat Selesai",
          value: (row) => {
            const { rest_end } = row as {
              rest_end?: Timestamp;
            };

            if (rest_end instanceof Timestamp) {
              return formatTimestamp(rest_end);
            }
            return "-";
          },
        },
        {
          label: "Masuk",
          value: "",
        },
        {
          label: "Durasi Telat",
          value: (row) => {
            const { clock_in } = row as {
              clock_in?: Timestamp;
            };

            if (clock_in instanceof Timestamp) {
              const { seconds, nanoseconds } = clock_in;
              const milliseconds = seconds * 1000 + nanoseconds / 1000000;
              const formattedDate = new Date(milliseconds);

              const hours = formattedDate.getHours();
              const minutes = formattedDate.getMinutes();

              if (hours < 12 && hours >= 6) {
                return `${hours - 6}:${minutes.toString().padStart(2, "0")}`;
              }
              if (hours < 23 && hours >= 18) {
                return `${hours - 18}:${minutes.toString().padStart(2, "0")}`;
              }
            }
            return "-";
          },
        },
        {
          label: "Potongan Telat",
          value: (row) => {
            const { clock_in } = row as {
              clock_in?: Timestamp;
            };

            if (clock_in instanceof Timestamp) {
              const { seconds, nanoseconds } = clock_in;
              const milliseconds = seconds * 1000 + nanoseconds / 1000000;
              const formattedDate = new Date(milliseconds);

              const hours = formattedDate.getHours();
              const minutes = formattedDate.getMinutes();
  
              if (hours < 12 && hours >= 6) {
                return ((hours - 6) * 60 + minutes) * 500;
              }
              if (hours < 23 && hours >= 18) {
                return ((hours - 18) * 60 + minutes) * 500;
              }
            }
            return "";
          },
        },
        {
          label: "Keluar",
          value: "",
        },
        {
          label: "Lembur",
          value: "",
        },
        {
          label: "Jam Kerja",
          value: "",
        },
        {
          label: "Gaji",
          value: "",
        },
      ],
    });
  }

  const settings = {
    fileName: `Monthly Attendance Reports (${month} - ${year})`,
  };

  xlsx(columns, settings);
}
