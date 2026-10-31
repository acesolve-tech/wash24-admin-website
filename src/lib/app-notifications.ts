import { db } from "@/config/firebase";
import {
    APP_NOTIFICATION_LIMITS,
    APP_NOTIFICATIONS_COLLECTION,
    BROADCAST_TARGET,
    OrderNotificationEvent,
    orderNotificationText,
    SYSTEM_SENDER,
} from "@/constants/app-notifications";
import { firestoreErrorMessage, SubscriptionError, toSubscriptionError } from "./firestore-errors";
import { normalizePhone } from "./phone";
import {
    AppNotification,
    AppNotificationInput,
    AppNotificationType,
} from "@/types/app-notification";
import { AppOrderMethod } from "@/types/app-order";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    where,
} from "firebase/firestore";

type Result<T> = { success: boolean; data: T; message: string };

const TYPES: AppNotificationType[] = ["broadcast", "personal", "order-status"];

const toText = (value: unknown) => (typeof value === "string" ? value : "");

const notificationsRef = () => collection(db, APP_NOTIFICATIONS_COLLECTION);

export function toAppNotification(id: string, data: Record<string, unknown>): AppNotification {
    const createdAt =
        data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : toText(data.createdAt);
    const target = toText(data.target);
    return {
        id,
        title: toText(data.title),
        body: toText(data.body),
        target,
        type: TYPES.includes(data.type as AppNotificationType)
            ? (data.type as AppNotificationType)
            : target === BROADCAST_TARGET
                ? "broadcast"
                : "personal",
        orderId: toText(data.orderId),
        outletId: toText(data.outletId),
        createdAt,
        createdBy: toText(data.createdBy),
    };
}

export const newNotificationRef = () => doc(notificationsRef());

export function orderNotificationData(
    event: OrderNotificationEvent,
    order: { id: string; customerPhone: string; outletId: string; outletName: string; method: AppOrderMethod }
) {
    const text = orderNotificationText(event, order);
    if (!text) return null;
    return {
        title: text.title,
        body: text.body,
        target: order.customerPhone,
        type: "order-status" as AppNotificationType,
        orderId: order.id,
        ...(order.outletId ? { outletId: order.outletId } : {}),
        createdAt: new Date().toISOString(),
        serverCreatedAt: serverTimestamp(),
        createdBy: SYSTEM_SENDER,
    };
}

export function validateAppNotificationInput(
    input: AppNotificationInput,
    { canBroadcast, requireOutlet }: { canBroadcast: boolean; requireOutlet: boolean }
): { value: AppNotificationInput; error: string | null } {
    const isBroadcast = input.target === BROADCAST_TARGET;
    const value: AppNotificationInput = {
        title: input.title.trim().replace(/\s+/g, " "),
        body: input.body.trim(),
        target: isBroadcast ? BROADCAST_TARGET : normalizePhone(input.target) ?? "",
        orderId: isBroadcast ? "" : input.orderId.trim(),
        outletId: isBroadcast ? "" : input.outletId.trim(),
    };
    const { titleMax, bodyMax } = APP_NOTIFICATION_LIMITS;
    const fail = (error: string) => ({ value, error });

    if (isBroadcast && !canBroadcast) return fail("Hanya akun Master yang bisa mengirim broadcast.");
    if (!isBroadcast && !value.target) return fail("Pilih pelanggan penerima.");
    if (!isBroadcast && requireOutlet && !value.outletId) {
        return fail("Pelanggan ini belum pernah pesan di outlet Anda.");
    }
    if (!value.title) return fail("Jusul wajib diisi.");
    if (value.title.length > titleMax) return fail(`Judul maksimal ${titleMax} karakter.`);
    if (!value.body) return fail("Isi pesan wajib diisi.");
    if (value.body.length > bodyMax) return fail(`Isi pesan maksimal ${bodyMax} karakter.`);
    return { value, error: null };
}

export async function sendAppNotification(
    input: AppNotificationInput,
    options: { canBroadcast: boolean; requireOutlet: boolean; actorEmail: string }
): Promise<Result<{ id: string }>> {
    const { value, error } = validateAppNotificationInput(input, options);
    if (error) return { success: false, data: { id: "" }, message: error };

    const isBroadcast = value.target === BROADCAST_TARGET;
    try {
        const ref = await addDoc(notificationsRef(), {
            title: value.title,
            body: value.body,
            target: value.target,
            type: isBroadcast ? "broadcast" : "personal",
            ...(value.orderId ? { orderId: value.orderId } : {}),
            ...(value.outletId ? { outletId: value.outletId } : {}),
            createdAt: new Date().toISOString(),
            serverCreatedAt: serverTimestamp(),
            createdBy: options.actorEmail,
        });
        return { success: true, data: { id: ref.id }, message: "" };
    } catch (err) {
        return {
            success: false,
            data: { id: "" },
            message: firestoreErrorMessage(err, "Notifikasi gagal dikirim. Coba lagi."),
        };
    }
}

export function subscribeAppNotifications(
    outletIds: string[] | null,
    max: number,
    onData: (notifications: AppNotification[], hasMore: boolean) => void,
    onError: (error: SubscriptionError) => void
): () => void {
    if (outletIds && outletIds.length === 0) {
        onData([], false);
        return () => { };
    }

    const constraints = [
        ...(outletIds ? [where("outletId", "in", outletIds)] : []),
        orderBy("createdAt", "desc"),
        limit(max),
    ];

    return onSnapshot(
        query(notificationsRef(), ...constraints),
        (snapshot) => {
            onData(
                snapshot.docs.map((item) => toAppNotification(item.id, item.data())),
                snapshot.size >= max
            );
        },
        (error) => onError(toSubscriptionError(error, "Daftar notifikasi gagal dimuat. Coba lagi."))
    );
}

export async function deleteAppNotification(id: string): Promise<Result<null>> {
    try {
        await deleteDoc(doc(db, APP_NOTIFICATIONS_COLLECTION, id));
        return { success: true, data: null, message: "" };
    } catch (error) {
        return {
            success: false,
            data: null,
            message: firestoreErrorMessage(error, "Notifikasi gagal dihapus. Coba lagi."),
        };
    }
}