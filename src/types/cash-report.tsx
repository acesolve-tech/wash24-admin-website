import { Timestamp } from "firebase/firestore";

export type CashReport = {
  id: string;
  date: Timestamp;
  information: string;
  income?: number;
  expense?: number;
  currentTotal: number;
  note?: string | null;
  note_2?: string | null;
};