import { LocationKey } from "@/constants/locations";

export type User = {
  uid: string;
  name: string;
  gender: string;
  location: string;
  branch?: LocationKey;
  phone: string;
  role: string;
  position: string;
  address: string;
  bank_account: string;
  bank_name: string;
};
