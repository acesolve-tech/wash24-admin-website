import { db, storage } from "@/config/firebase";
import { AttendanceGeo } from "@/types/attendance";
import { User } from "@/types/user";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";

const getCurrentDateString = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
};

const getPreviousDateString = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const checkDocumentExistence = async (name: string, date: string) => {
  const q = query(
    collection(db, "attendance"),
    where("name", "==", name),
    where("date", "==", date)
  );

  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

const uploadAttendancePhoto = async (
  name: string,
  dateString: string,
  attendanceType: string,
  photoDataUrl: string
): Promise<string> => {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `attendance_photos/${safeName}-${dateString}-${attendanceType}-${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadString(storageRef, photoDataUrl, "data_url");
  return await getDownloadURL(storageRef);
};

const updateOrAddDocument = async (
  name: string,
  selectedOption: string,
  extras: Record<string, any> = {}
) => {
  const currentDate = getCurrentDateString();
  let documentExists = await checkDocumentExistence(name, currentDate);

  const data: Record<string, any> = {
    name: name,
    [selectedOption]: serverTimestamp(),
    ...extras,
  };

  let attendanceDocRef = doc(db, "attendance", `${name}-${currentDate}`);

  if (selectedOption !== "clock_in") {
    if (!documentExists) {
      const yesterdayDate = getPreviousDateString();
      documentExists = await checkDocumentExistence(name, yesterdayDate);
      attendanceDocRef = doc(db, "attendance", `${name}-${yesterdayDate}`);
    }
  }

  if (documentExists) {
    setDoc(attendanceDocRef, data, { merge: true });
  } else if (selectedOption === "clock_in") {
    data.date = currentDate;
    setDoc(attendanceDocRef, data);
  }
};

export const insertOrUpdateAttendance = async (
  userId: string,
  attendanceType: string,
  options?: { photo?: string; location?: AttendanceGeo | null }
) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return {
        success: false,
        data: null,
        message: "Karyawan Tidak Ditemukan",
      };
    }

    const userData = userSnap.data();
    const name = userData.name;

    if (!name) {
      return {
        success: false,
        data: null,
        message: "Nama Karyawan Tidak Ada",
      };
    }

    const isClockEvent =
      attendanceType === "clock_in" || attendanceType === "clock_out";

    if (isClockEvent) {
      if (!options?.photo) {
        return {
          success: false,
          data: null,
          message: "Foto Wajib Diambil",
        };
      }
      if (!options?.location) {
        return {
          success: false,
          data: null,
          message: "Lokasi GPS Wajib Diaktifkan",
        };
      }
    }

    const extras: Record<string, any> = {};
    if (isClockEvent && options?.photo) {
      const photoUrl = await uploadAttendancePhoto(
        name,
        getCurrentDateString(),
        attendanceType,
        options.photo
      );
      extras[`${attendanceType}_photo`] = photoUrl;
    }
    if (isClockEvent && options?.location) {
      extras[`${attendanceType}_location`] = options.location;
    }

    await updateOrAddDocument(name, attendanceType, extras);
    return {
      success: true,
      data: null,
      message: "Absensi Berhasil",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Terjadi Kesalahan. Silakan Coba Lagi.",
    };
  }
};

export const fetchAttendance = async (selectedDate: Date) => {
  try {
    const userQuerySnapshot = await getDocs(
      query(collection(db, "users"), where("role", "==", "Staff")) 
    );
    const fetchedPeople = userQuerySnapshot.docs
      .map((doc) => {
        const data = doc.data() as User;
        return { ...data, id: doc.id };
      })
      .filter((person) => !person.name.startsWith("Kurir"));

    const currentDate = selectedDate
      ? new Date(
          selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000
        )
          .toISOString()
          .split("T")[0]
      : new Date().toISOString().split("T")[0];
    const promises = fetchedPeople.map(async (user) => {
      const attendanceDocId = `${user.name}-${currentDate}`;

      const attendanceDocRef = doc(db, "attendance", attendanceDocId);
      const attendanceDocSnapshot = await getDoc(attendanceDocRef);
      const attendanceData = attendanceDocSnapshot.exists()
        ? {
            ...attendanceDocSnapshot.data(),
            location: user.location,
          }
        : {
            name: user.name,
            location: user.location,
            clock_in: "",
            clock_out: "",
          };

      return attendanceData as any;
    });

    const fetchedDailyReport = await Promise.all(promises);
    return {
      success: true,
      data: fetchedDailyReport,
      message: "Laporan Absensi Berhasil",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Laporan Absensi Gagal",
    };
  }
};

export const updateAttendance = async (
  selectedDate: Date | undefined,
  payload: any
) => {
  try {
    const baseDate = selectedDate ?? new Date();
    const formatedDate = new Date(
      baseDate.getTime() - baseDate.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    const attendanceDocId = `${payload.selectedName}-${formatedDate}`;
    const attendanceDocRef = doc(db, "attendance", attendanceDocId);

    const buildTimestamp = (
      base: Date,
      hours: string,
      minutes: string
    ): Timestamp => {
      const date = new Date(base);
      date.setHours(parseInt(hours));
      date.setMinutes(parseInt(minutes));
      date.setSeconds(0);
      date.setMilliseconds(0);
      return Timestamp.fromDate(date);
    };

    const updateObject: Record<string, any> = {};

    if (payload.clockInHours !== "" && payload.clockInMinutes !== "") {
      const clockInDate = new Date(baseDate);
      updateObject.clock_in = buildTimestamp(
        clockInDate,
        payload.clockInHours,
        payload.clockInMinutes
      );
    }

    if (payload.clockOutHours !== "" && payload.clockOutMinutes !== "") {
      const clockOutDate = new Date(baseDate);
      const inHours = parseInt(payload.clockInHours);
      const inMinutes = parseInt(payload.clockInMinutes);
      const outHours = parseInt(payload.clockOutHours);
      const outMinutes = parseInt(payload.clockOutMinutes);

      if (
        outHours < inHours ||
        (outHours === inHours && outMinutes < inMinutes)
      ) {
        clockOutDate.setDate(clockOutDate.getDate() + 1);
      }

      updateObject.clock_out = buildTimestamp(
        clockOutDate,
        payload.clockOutHours,
        payload.clockOutMinutes
      );
    }

    if (payload.restStartHours !== "" && payload.restStartMinutes !== "") {
      const restStartDate = new Date(baseDate);
      updateObject.rest_start = buildTimestamp(
        restStartDate,
        payload.restStartHours,
        payload.restStartMinutes
      );
    }

    if (payload.restEndHours !== "" && payload.restEndMinutes !== "") {
      const restEndDate = new Date(baseDate);
      const rsHours = parseInt(payload.restStartHours);
      const rsMinutes = parseInt(payload.restStartMinutes);
      const reHours = parseInt(payload.restEndHours);
      const reMinutes = parseInt(payload.restEndMinutes);

      if (reHours < rsHours || (reHours === rsHours && reMinutes < rsMinutes)) {
        restEndDate.setDate(restEndDate.getDate() + 1);
      }

      updateObject.rest_end = buildTimestamp(
        restEndDate,
        payload.restEndHours,
        payload.restEndMinutes
      );
    }

    const attendanceDocSnapshot = await getDoc(attendanceDocRef);
    if (attendanceDocSnapshot.exists()) {
      await updateDoc(attendanceDocRef, updateObject);
    } else {
      const updateObjectWithName = {
        ...updateObject,
        name: payload.selectedName,
        date: baseDate,
      };
      await setDoc(attendanceDocRef, updateObjectWithName);
    }

    return {
      success: true,
      data: null,
      message: "Laporan Absensi Berhasil Diubah",
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Laporan Absensi Gagal Diubah",
    };
  }
};
