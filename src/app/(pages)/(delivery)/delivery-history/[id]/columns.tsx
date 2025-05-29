"use client";

import { Delivery } from "@/types/delivery";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Delivery>[] = [
  {
    header: "Name",
    accessorKey: "name",
  },
  {
    header: "Phone",
    accessorKey: "phone",
  },
  {
    header: "Status",
    accessorKey: "status",
  },
  {
    header: "Type",
    accessorKey: "type",
  },
  {
    header: "Driver",
    accessorKey: "driver",
  },
  {
    header: "Note",
    accessorKey: "note",
  },
  {
    header: "Finish Date",
    accessorKey: "finish_date",
  },
  {
    header: "Finish Time",
    accessorKey: "finish_time",
  },
];
