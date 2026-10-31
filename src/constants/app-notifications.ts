import { AppNotificationType } from "@/types/app-notification";
import { AppOrderMethod, AppOrderStatus } from "@/types/app-order";

export const APP_NOTIFICATIONS_COLLECTION = "app-notifications";

export const BROADCAST_TARGET = "all";

export const SYSTEM_SENDER = "system";

export const APP_NOTIFICATION_LIMITS = {
    titleMax: 60,
    bodyMax: 300,
};

export const APP_NOTIFICATION_PAGE_SIZE = 100;

export const APP_NOTIFICATION_TYPE: Record<AppNotificationType, { label: string; className: string }> = {
    broadcast: { label: "Broadcast", className: "bg-violet-50 text-violet-700" },
    personal: { label: "Personal", className: "bg-sky-50 text-sky-700" },
    "order-status": { label: "Status pesanan", className: "bg-gray-100 text-gray-600" },
};

export type OrderNotificationEvent = "created" | AppOrderStatus;

export function orderNotificationText(
    event: OrderNotificationEvent,
    order: { id: string; outletName: string; method: AppOrderMethod }
) : { title: string; body: string } | null {
    const id = order.id;
    const atOutlet = order.outletName ? ` di outlet ${order.outletName}` : "";
    const outlet = order.outletName ?  `outlet ${order.outletName}` : "outlet";

    switch (event) {
        case "created":
            return { title: "Pesanan dicatat", body: `Pesanan ${id} sudah kami catat${atOutlet}.` };
        case "processing":
            return { title: "Pesanan diproses", body: `Pesanan ${id} sedang kami proses.` };
        case "ready":
            return {
                title: "Pesanan siap",
                body:
                    order.method === "pickup"
                        ? `Pesanan ${id} sudah selesai dan akan segera diantar.`
                        : `Pesanan ${id} sudah selesai dan siap diambil${atOutlet}.`,
            };
        case "completed":
            return {
                title: "Pesanan selesai",
                body: `Pesanan ${id} selesai. Terima kasih sudah memakai Wash24!`,
            };
        case "cancelled":
            return {
                title: "Pesanan dibatalkan",
                body: `Pesanan ${id} dibatalkan. Hubungi ${outlet} kalau ada pertanyaan.`,
            };
        default:
            return null;
    }
}