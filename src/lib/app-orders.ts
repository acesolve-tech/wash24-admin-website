import { db } from "@/config/firebase";
import { APP_CUSTOMER_COLLECTION, APP_ORDER_SUBCOLLECTION } from "@/constants/app-customers";
import { findAppOutlet } from "@/constants/app-outlets";
import {
    APP_ORDER_NOTE_MAX,
    APP_ORDER_STATUS,
    APP_ORDER_STATUSES,
    APP_ORDER_UNIT_RULES,
    DELIVERY_FEE,
    FREE_DELIVERY_MIN,
} from "@/constants/app-orders";
import { AppServiceUnit } from "@/types/app-service";
import { AppOrder, AppOrderInput, AppOrderItem, AppOrderMethod, AppOrderStatus } from "@/types/app-order";
import {
    collection,
    collectionGroup,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    Timestamp,
    where,
} from "firebase/firestore";

type Result<T> = { success: boolean; data: T; message: string };

const toText = (value: unknown) => (typeof value === "string" ? value : "");
const toNumber = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? value : 0;

function toOrderItem(value: unknown, index: number): AppOrderItem {
    const item = (value ?? {}) as Record<string, unknown>;
    const serviceName = toText(item.serviceName);
    return {
        id: toText(item.id) || `item-${index}`,
        serviceId: toText(item.serviceId) || toText(item.id),
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

function errorMessage(error: unknown, fallback: string) {
    const code = (error as { code?: string })?.code;
    if (code === "permission-denied") return "Akses ke data pesanan ditolak oleh Firebase.";
    if (code === "unavailable") return "Tidak ada koneksi ke server. Periksa internet lalu coba lagi.";
    return fallback;
}

export function calcDeliveryFee(method: AppOrderMethod, subtotal: number): number {
    if (method !== "pickup") return 0;
    return subtotal < FREE_DELIVERY_MIN ? DELIVERY_FEE : 0;
}

export const calcSubtotal = (items: AppOrderItem[]) =>
    Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0));

export function roundQuantity(quantity: number, unit: string): number {
    const rule = APP_ORDER_UNIT_RULES[unit as AppServiceUnit];
    const factor = 10 ** (rule?.decimals ?? 2);
    return Math.round(quantity * factor) / factor;
}

export function validateAppOrderInput(
    input: AppOrderInput,
    outletIds: string[]
): { value: AppOrderInput; error: string | null } {
    const isPickup = input.method === "pickup";
    const value: AppOrderInput = {
        ...input,
        pickupAddress: isPickup ? input.pickupAddress.trim() : "",
        note: input.note.trim(),
        deliveryFee: isPickup ? input.deliveryFee : 0,
        items: input.items.map((item) => ({ ...item, quantity: roundQuantity(item.quantity, item.unit) })),
    };
    const fail = (error: string) => ({ value, error });

    if (!value.outletId || !outletIds.includes(value.outletId)) return fail("Pilih outlet.");
    if (!APP_ORDER_STATUSES.includes(value.status)) return fail("Status pesanan tidak valid.");
    if (value.items.length === 0) return fail("Tambahkan minimal satu item.");

    for (const item of value.items) {
        const rule = APP_ORDER_UNIT_RULES[item.unit as AppServiceUnit];
        const label = item.itemName || item.serviceName;
        if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
            return fail(`Jumlah ${label} harus lebih dari 0.`);
        }
        if (rule && (item.quantity < rule.min || item.quantity > rule.max)) {
            return fail(`Jumlah ${label} harus antara ${rule.min} dan ${rule.max} ${item.unit}.`);
        }
        if (!Number.isInteger(item.price) || item.price <= 0) {
            return fail(`Harga ${label} tidak valid.`);
        }
    }

    if (isPickup && !value.pickupAddress) return fail("Alamat jemput wajib diisi untuk antar jemput.");
    if (!Number.isInteger(value.deliveryFee) || value.deliveryFee < 0) {
        return fail("Biaya antar jemput tidak valid.");
    }
    if (value.note.length > APP_ORDER_NOTE_MAX) {
        return fail(`Catatan maksimal ${APP_ORDER_NOTE_MAX} karakter.`);
    }
    return { value, error: null };
}

function toOrderFields(value: AppOrderInput) {
    const subtotal = calcSubtotal(value.items);
    return {
        status: value.status,
        method: value.method,
        note: value.note,
        items: value.items.map((item) => ({
            id: item.id,
            serviceId: item.serviceId,
            serviceName: item.serviceName,
            itemName: item.itemName || item.serviceName,
            price: item.price,
            unit: item.unit,
            quantity: item.quantity,
        })),
        subtotal,
        deliveryFee: value.deliveryFee,
        total: subtotal + value.deliveryFee,
        outletId: value.outletId,
        outletName: findAppOutlet(value.outletId)?.name ?? "",
        pickupAddress: value.pickupAddress,
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
    } catch (error) {
        return {
            success: false,
            data: { orders: [], hiddenCount: 0 },
            message: errorMessage(error, "Riwayat pesanan gagal dimuat. Coba lagi."),
        };
    }
}

export type OrdersSubscriptionError = {
    message: string;
    indexUrl: string | null;
};

export function subscribeOutletOrders(
    outletIds: string[],
    max: number,
    onData: (orders: AppOrder[], hasMore: boolean) => void,
    onError: (error: OrdersSubscriptionError) => void
): () => void {
    if (outletIds.length === 0) {
        onData([], false);
        return () => { };
    }

    const ordersQuery = query(
        collectionGroup(db, APP_ORDER_SUBCOLLECTION),
        where("outletId", "in", outletIds),
        orderBy("createdAt", "desc"),
        limit(max)
    );

    return onSnapshot(
        ordersQuery,
        (snapshot) => {
            const orders = snapshot.docs.map((item) =>
                toAppOrder(item.ref.parent.parent?.id ?? "", item.id, item.data())
            );
            onData(orders, snapshot.size >= max);
        },
        (error) => {
            const code = (error as { code?: string })?.code;
            if (code === "failed-precondition") {
                const indexUrl = /https:\/\/console\.firebase\.google\.com\S+/.exec(error.message)?.[0];
                onError({
                    message:
                        "Index Firestore untuk daftar pesanan belum dibuat. Akun Master: klik link di bawah, lalu Create index. Tunggu 2–5 menit sampai statusnya Enabled, lalu muat ulang halaman ini.",
                    indexUrl: indexUrl ?? null,
                });
                return;
            }
            onError({ message: errorMessage(error, "Daftar pesanan gagal dimuat. Coba lagi."), indexUrl: null });
        }
    );
}

const generateOrderId = () => "WSH-" + String(Date.now() + Math.floor(Math.random() * 1000)).slice(-6);

const CUSTOMER_NOT_FOUND = "customer-not-found";
const ID_TAKEN = "id-taken";
const ORDER_NOT_FOUND = "order-not-found";
const STATUS_CHANGED = "status-changed";

export async function createAppOrder(
    phone: string,
    input: AppOrderInput,
    outletIds: string[],
    actorEmail: string
): Promise<Result<{ id: string }>> {
    const { value, error } = validateAppOrderInput(input, outletIds);
    if (error) return { success: false, data: { id: "" }, message: error };

    const customerRef = doc(db, APP_CUSTOMER_COLLECTION, phone);

    for (let attempt = 0; attempt < 3; attempt++) {
        const id = generateOrderId();
        const orderRef = doc(db, APP_CUSTOMER_COLLECTION, phone, APP_ORDER_SUBCOLLECTION, id);
        try {
            await runTransaction(db, async (transaction) => {
                const customer = await transaction.get(customerRef);
                if (!customer.exists()) throw new Error(CUSTOMER_NOT_FOUND);
                const existing = await transaction.get(orderRef);
                if (existing.exists()) throw new Error(ID_TAKEN);
                const now = new Date().toISOString();
                transaction.set(orderRef, {
                    id,
                    createdAt: now,
                    ...toOrderFields(value),
                    serverCreatedAt: serverTimestamp(),
                    source: "admin",
                    createdBy: actorEmail,
                    updatedAt: now,
                    updatedBy: actorEmail,
                });
            });
            return { success: true, data: { id }, message: "" };
        } catch (err) {
            const reason = (err as Error)?.message;
            if (reason === ID_TAKEN) continue;
            if (reason === CUSTOMER_NOT_FOUND) {
                return { success: false, data: { id: "" }, message: "Customer tidak ditemukan." };
            }
            return {
                success: false,
                data: { id: "" },
                message: errorMessage(err, "Pesanan gagal disimpan. Coba lagi."),
            };
        }
    }
    return { success: false, data: { id: "" }, message: "Pesanan gagal disimpan. Coba lagi." };
}

export async function updateAppOrder(
    phone: string,
    orderId: string,
    input: AppOrderInput,
    expectedStatus: AppOrderStatus,
    outletIds: string[],
    actorEmail: string
): Promise<Result<null>> {
    const { value, error } = validateAppOrderInput(input, outletIds);
    if (error) return { success: false, data: null, message: error };

    const orderRef = doc(db, APP_CUSTOMER_COLLECTION, phone, APP_ORDER_SUBCOLLECTION, orderId);
    let currentStatus: AppOrderStatus = expectedStatus;

    try {
        await runTransaction(db, async (transaction) => {
            const current = await transaction.get(orderRef);
            if (!current.exists()) throw new Error(ORDER_NOT_FOUND);
            currentStatus = toAppOrder(phone, orderId, current.data()).status;
            if (currentStatus !== expectedStatus) throw new Error(STATUS_CHANGED);
            transaction.update(orderRef, {
                ...toOrderFields(value),
                updatedAt: new Date().toISOString(),
                serverUpdatedAt: serverTimestamp(),
                updatedBy: actorEmail,
            });
        });
        return { success: true, data: null, message: "" };
    } catch (err) {
        const reason = (err as Error)?.message;
        if (reason === ORDER_NOT_FOUND) {
            return { success: false, data: null, message: "Pesanan tidak ditemukan, mungkin sudah dihapus." };
        }
        if (reason === STATUS_CHANGED) {
            return {
                success: false,
                data: null,
                message: `Status pesanan ini baru saja berubah jadi "${APP_ORDER_STATUS[currentStatus].label}", mungkin oleh customer di app. Tutup form lalu buka lagi supaya datanya terbaru.`,
            };
        }
        return {
            success: false,
            data: null,
            message: errorMessage(err, "Perubahan pesanan gagal disimpan. Coba lagi."),
        };
    }
}