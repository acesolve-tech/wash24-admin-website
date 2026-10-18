import { db, storage } from "@/config/firebase";
import { ATTENDANCE_LABELS } from "@/constants/attendance";
import { AttendanceGeo, AttendanceType } from "@/types/attendance";
import { User } from "@/types/user";
import {
  collection,
  doc,
  DocumentData,
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

type AttendanceResult = {
  success: boolean;
  data: null;
  message: string;
};

type AttendanceRecord = DocumentData | null;

export type AttendanceRuleResult =
  | { ok: true; target: "today" | "yesterday" }
  | { ok: false; message: string };

const GENERIC_ERROR = "Terjadi kesalahan. Silakan coba lagi.";

const formatDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentDateString = () => formatDateString(new Date());

const getPreviousDateString = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatDateString(date);
};

const getAttendanceDocId = (name: string, date: string) => `${name}-${date}`;

const failed = (message: string): AttendanceResult => ({
  success: false,
  data: null,
  message,
});

export function resolveAttendanceAction(
  type: AttendanceType,
  today: AttendanceRecord,
  yesterday: AttendanceRecord
): AttendanceRuleResult {
  if (type === "clock_in") {
    if (today?.clock_in) {
      return { ok: false, message: "Sudah absen Datang Kerja hari ini." };
    }
    return { ok: true, target: "today" };
  }

  let target: "today" | "yesterday";
  let shift: DocumentData;

  if (today?.clock_in) {
    target = "today";
    shift = today;
  } else if (yesterday?.clock_in && !yesterday?.clock_out) {
    target = "yesterday";
    shift = yesterday;
  } else {
    return { ok: false, message: "Belum absen Datang Kerja." };
  }

  if (shift.clock_out) {
    return { ok: false, message: "Sudah absen Pulang Kerja untuk shift ini." };
  }
  if (shift[type]) {
    return {
      ok: false,
      message: `Sudah absen ${ATTENDANCE_LABELS[type]} untuk shift ini.`,
    };
  }
  if (type === "rest_end" && !shift.rest_start) {
    return { ok: false, message: "Belum absen Mulai Istirahat." };
  }

  return { ok: true, target };
}

const getStaffName = async (userId: string): Promise<string | null> => {
  const userSnap = await getDoc(doc(db, "users", userId));
  if (!userSnap.exists()) return null;
  const name = userSnap.data().name;
  return typeof name === "string" && name.trim() ? name : null;
};

const validateAttendance = async (
  userId: string,
  type: AttendanceType
): Promise<
  { ok: true; name: string; docId: string } | { ok: false; message: string }
> => {
  const name = await getStaffName(userId);
  if (!name) {
    return { ok: false, message: "Data karyawan tidak ditemukan." };
  }

  const todayId = getAttendanceDocId(name, getCurrentDateString());
  const yesterdayId = getAttendanceDocId(name, getPreviousDateString());
  const [todaySnap, yesterdaySnap] = await Promise.all([
    getDoc(doc(db, "attendance", todayId)),
    getDoc(doc(db, "attendance", yesterdayId)),
  ]);

  const rule = resolveAttendanceAction(
    type,
    todaySnap.exists() ? todaySnap.data() : null,
    yesterdaySnap.exists() ? yesterdaySnap.data() : null
  );
  if (!rule.ok) return rule;

  return {
    ok: true,
    name,
    docId: rule.target === "today" ? todayId : yesterdayId,
  };
};

const uploadAttendancePhoto = async (
  name: string,
  dateString: string,
  attendanceType: AttendanceType,
  photoDataUrl: string
): Promise<string> => {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `attendance_photos/${safeName}-${dateString}-${attendanceType}-${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadString(storageRef, photoDataUrl, "data_url");
  return await getDownloadURL(storageRef);
};

export const checkAttendance = async (
  userId: string,
  type: AttendanceType
): Promise<AttendanceResult> => {
  try {
    const result = await validateAttendance(userId, type);
    if (!result.ok) return failed(result.message);
    return { success: true, data: null, message: "" };
  } catch (error) {
    console.error("checkAttendance:", error);
    return failed(GENERIC_ERROR);
  }
};

export const insertOrUpdateAttendance = async (
  userId: string,
  type: AttendanceType,
  options: { photo: string; location: AttendanceGeo | null }
): Promise<AttendanceResult> => {
  try {
    if (!options?.photo) return failed("Foto wajib diambil.");
    if (!options?.location) return failed("Lokasi GPS wajib diaktifkan.");

    const result = await validateAttendance(userId, type);
    if (!result.ok) return failed(result.message);

    const currentDate = getCurrentDateString();
    const photoUrl = await uploadAttendancePhoto(
      result.name,
      currentDate,
      type,
      options.photo
    );

    const data: Record<string, unknown> = {
      name: result.name,
      [type]: serverTimestamp(),
      [`${type}_photo`]: photoUrl,
      [`${type}_location`]: options.location,
    };
    if (type === "clock_in") {
      data.date = currentDate;
    }

    await setDoc(doc(db, "attendance", result.docId), data, { merge: true });

    return {
      success: true,
      data: null,
      message: `Absen ${ATTENDANCE_LABELS[type]} berhasil.`,
    };
  } catch (error) {
    console.error("insertOrUpdateAttendance:", error);
    return failed(GENERIC_ERROR);
  }
};

export const fetchAttendance = async (
  selectedDate: Date,
  cities?: string[] | null
) => {
  try {
    const userQuerySnapshot = await getDocs(
      query(collection(db, "users"), where("role", "==", "Staff"))
    );
    const fetchedPeople = userQuerySnapshot.docs
      .map((doc) => {
        const data = doc.data() as User;
        return { ...data, id: doc.id };
      })
      .filter((person) => !person.name.startsWith("Kurir"))
      .filter((person) => !cities || cities.includes(person.location));

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

    const updateObject: Record<string, any> = { date: formatedDate };

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