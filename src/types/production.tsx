import { Timestamp } from "firebase/firestore";

export type Production = {
  id: string;
  customer_name: string;
  detail_production: any;
  production_staff: any;

  incoming_production: string;
  incoming_production_timestamp: Timestamp;
  wash: string;
  wash_timestamp: Timestamp;
  dry: string;
  dry_timestamp: Timestamp;
  iron: string;
  iron_timestamp: Timestamp;
  packing: string;
  packing_timestamp: Timestamp;
  desc: string;
  desc_timestamp: Timestamp;
  created_date: string;
};
