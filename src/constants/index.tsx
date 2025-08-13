import { SidebarItem } from "@/types/sidebar";
import {
  Settings,
  FileText,
  Clock,
  ClipboardMinus,
  User,
  KeyRound,
  Box,
  Truck,
  Banknote,
  Warehouse,
  ListChecks,
} from "lucide-react";

export const LOCATIONS = [
  { title: "Malang", key: "mlg", collectionName: "malang" },
  { title: "Surabaya Pusat", key: "sby", collectionName: "surabaya" },
  { title: "Surabaya Barat", key: "sby2", collectionName: "surabaya-2" },
  { title: "Surabaya Timur", key: "sby3", collectionName: "surabaya-3" },
  { title: "Jakarta Selatan", key: "jkt3", collectionName: "jakarta-3" },
];

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
  {
    title: "Tugas",
    icon: <ListChecks className="size-7" />,
    path: "/task",
    role: ["Master"],
  },
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
    subItems: generateLocationSubItems("/cash-report"),
  },
  {
    title: "Kas",
    icon: <Banknote className="size-7" />,
    path: "#",
    subItems: generateLocationSubItems("/cash"),
    role: ["Master"],
  },
  {
    title: "Stok",
    icon: <Warehouse className="size-7" />,
    path: "#",
    subItems: generateLocationSubItems("/stock"),
  },
];

export const ROUTE_PERMISSIONS = SIDEBAR_ITEMS.flatMap((item) => {
  const routes = [];

  function hasSubItems(
    item: SidebarItem
  ): item is SidebarItem & { subItems: SidebarItem[] } {
    return "subItems" in item && Array.isArray(item.subItems);
  }

  if (item.path !== "#") {
    routes.push({ path: item.path, role: item.role });
  }

  if (hasSubItems(item)) {
    routes.push(
      ...item.subItems.map((sub) => ({ path: sub.path, role: item.role }))
    );
  }

  return routes;
});
