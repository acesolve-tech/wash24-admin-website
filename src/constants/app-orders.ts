import { AppOrderMethod, AppOrderStatus } from "@/types/app-order";

export const APP_ORDER_STATUS: Record<AppOrderStatus, { label: string; className: string }> = {
    pending: { label: "Menunggu", className: "bg-amber-50 text-amber-700" },
    processing: { label: "Diproses", className: "bg-sky-50 text-sky-700" },
    ready: { label: "Siap", className: "bg-indigo-50 text-indigo-700" },
    completed: { label: "Selesai", className: "bg-emerald-50 text-emerald-700" },
    cancelled: { label: "Dibatalkan", className: "bg-gray-100 text-gray-600" },
};

export const APP_ORDER_STATUSES = Object.keys(APP_ORDER_STATUS) as AppOrderStatus[];

export const APP_ORDER_METHOD_LABEL: Record<AppOrderMethod, string> = {
    pickup: "Antar jemput",
    dropoff: "Antar sendiri ke outlet",
};