import { Timestamp } from "firebase/firestore";

export type AttendanceGeo = {
  lat: number;
  lng: number;
  accuracy: number | null;
};

export type Attendance = {
  name: string;
  location: string;
  clock_in: Timestamp;
  clock_out: Timestamp;
  clock_in_photo?: string;
  clock_out_photo?: string;
  clock_in_location?: AttendanceGeo;
  clock_out_location?: AttendanceGeo;
};
