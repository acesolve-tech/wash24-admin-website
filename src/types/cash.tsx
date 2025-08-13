import { Timestamp } from "firebase/firestore";

export type Cash = {
  id: string;
  date: Timestamp;
  infomation: string;
  income: number;
  expense: number;
  currentTotal: number;
};
