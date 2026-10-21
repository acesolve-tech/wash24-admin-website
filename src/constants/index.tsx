import { SidebarItem } from "@/types/sidebar";
import { LOCATIONS } from "./locations";
import {
  FileText,
  Clock,
  User,
  KeyRound,
  Box,
  Truck,
  Banknote,
  Smartphone,
} from "lucide-react";

export { LOCATIONS } from "./locations";

const generateLocationSubItems = (
  basePath: string,
  overrides: Partial<Record<string, string>> = {}
) =>
  LOCATIONS.map(({ title, key }) => ({
    title,
    path: `${basePath}/${overrides[key] ?? key}`,
  }));

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    title: "Absensi",
    icon: <Clock className="size-7" />,
    path: "/attendance",
    role: ["Master", "Admin"],
  },
  {
    title: "Laporan Absensi",
    icon: <FileText className="size-7" />,
    path: "/attendance-report",
    role: ["Master", "Admin"],
  },
  {
    title: "Karyawan",
    icon: <User className="size-7" />,
    path: "/staff",
    role: ["Master"],
  },
  {
    title: "OTP",
    icon: <KeyRound className="size-7" />,
    path: "/otp",
    role: ["Master"],
  },
  // {
  //   title: "Tugas",
  //   icon: <ListChecks className="size-7" />,
  //   path: "/task",
  //   role: ["Master"],
  // },
  {
    title: "Delivery",
    icon: <Truck className="size-7" />,
    path: "#",
    subItems: generateLocationSubItems("/delivery"),
  },
  {
    title: "Produksi",
    icon: <Box className="size-7" />,
    path: "#",
    subItems: generateLocationSubItems("/production"),
  },
  {
    title: "Tunai",
    icon: <Banknote className="size-7" />,
    path: "#",
    subItems: [
      ...generateLocationSubItems("/cash-report"),
      { title: "Kas", path: "/cash-report/kas" },
    ],
  },
  {
    title: "App Customer",
    icon: <Smartphone className="size-7" />,
    path: "#",
    subItems: [{ title: "Layanan", path: "/app-services" }],
  },
  // {
  //   title: "Stok",
  //   icon: <Warehouse className="size-7" />,
  //   path: "#",
  //   subItems: generateLocationSubItems("/stock"),
  // },
];
