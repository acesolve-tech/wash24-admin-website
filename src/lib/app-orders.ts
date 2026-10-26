import { db } from "@/config/firebase";
import { APP_CUSTOMER_COLLECTION, APP_ORDER_SUBCOLLECTION } from "@/constants/app-customers";
import { APP_ORDER_STATUSES } from "@/constants/app-orders";
import { AppOrder, AppOrderItem, AppOrderStatus } from "@/types/app-order";
import { collection, getDocs, Timestamp } from "firebase/firestore";

type Result<T> = { success: boolean; data: T; message: string };

const toText = (value: unknown) => (typeof value === "string" ? value : "");
const toNumber = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? value : 0;

function toOrderItem(value: unknown, index: number): AppOrderItem {
    const item = (value ?? {}) as Record<string, unknown>;
    const serviceName = toText(item.serviceName);
    return {
        id: toText(item.id) || `item-${index}`,
        serviceId: toText(item.serviceId),
        serviceName,
        itemName: toText(item.itemName) || serviceName,
        price: toNumber(item.price),
        unit: toText(item.unit),
        quantity: toNumber(item.quantity),
    };
}

export function toAppOrder(
    customerPhone: string,
    id: string,
    data: Record<string, unknown>
): AppOrder {
    const createdAt =
        data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : toText(data.createdAt);
    return {
        id,
        customerPhone,
        createdAt,
        status: APP_ORDER_STATUSES.includes(data.status as AppOrderStatus)
            ? (data.status as AppOrderStatus)
            : "pending",
        method: data.method === "dropoff" ? "dropoff" : "pickup",
        note: toText(data.note),
        items: Array.isArray(data.items) ? data.items.map(toOrderItem) : [],
        subtotal: toNumber(data.subtotal),
        deliveryFee: toNumber(data.deliveryFee),
        total: toNumber(data.total),
        outletId: toText(data.outletId),
        outletName: toText(data.outletName),
        pickupAddress: toText(data.pickupAddress),
    };
}

export async function fetchCustomerOrders(
    phone: string,
    outletIds: string[] | null
): Promise<Result<{ orders: AppOrder[]; hiddenCount: number }>> {
    try {
        const snapshot = await getDocs(
            collection(db, APP_CUSTOMER_COLLECTION, phone, APP_ORDER_SUBCOLLECTION)
        );
        const all = snapshot.docs
            .map((item) => toAppOrder(phone, item.id, item.data()))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const orders = outletIds ? all.filter((order) => outletIds.includes(order.outletId)) : all;
        return {
            success: true,
            data: { orders, hiddenCount: all.length - orders.length },
            message: "",
        };
    } catch {
        return {
            success: false,
            data: { orders: [], hiddenCount: 0 },
            message: "Riwayat pesanan gagal dimuat. Coba lagi.",
        };
    }
}