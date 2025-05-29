import { Timestamp } from "firebase/firestore";

export type CashReport = {
  id: string;
  date: Timestamp;
  infomation: string;
  income: Number;
  expense: Number;
  currentTotal: Number;
};
