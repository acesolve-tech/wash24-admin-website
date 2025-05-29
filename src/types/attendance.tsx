import { Timestamp } from "firebase/firestore";

export type Attendance = {
  name: string;
  location: string;
  clock_in: Timestamp;
  clock_out: Timestamp;
};
