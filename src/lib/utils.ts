import { clsx, type ClassValue } from "clsx";
import { Timestamp } from "firebase/firestore";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestampShort(ts: Timestamp | null) {
  if (!ts) return "-";

  const date = ts.toDate();

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  // const yy = String(date.getFullYear()).slice(2); // last 2 digits

  return `${dd}/${mm}`;
}
