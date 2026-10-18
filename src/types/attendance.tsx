import { Timestamp } from "firebase/firestore";

export type AttendanceType = "clock_in" | "clock_out" | "rest_start" | "rest_end";

export type AttendanceGeo = {
  lat: number;
  lng: number;
  accuracy: number | null;
};

export type Attendance = {
  name: string;
  location: string;
  date?: string;
} & Partial<Record<AttendanceType, Timestamp>> &
  Partial<Record<`${AttendanceType}_photo`, string>> &
  Partial<Record<`${AttendanceType}_location`, AttendanceGeo>>;