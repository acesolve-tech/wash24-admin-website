import { getApps, initializeApp } from "firebase/app";
import { 
    arrayRemove,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    runTransaction,
    updateDoc,
} from "firebase/firestore";
import { firebaseOptions } from "@/config/firebase-options";
import { APP_CUSTOMER_COLLECTION } from "@/constants/app-customers";
import { APP_NOTIFICATIONS_COLLECTION, BROADCAST_TARGET } from "@/constants/app-notifications";
import { pushAttempt } from "@/lib/push-rules";
import { AppNotificationPush } from "@/types/app-notification";
import { isExpoPushToken, sendExpoPush } from "./expo-push";
import { PushDeps, PushNotificationRecord, PushRecipient } from "./push-dispatch";

const SERVER_APP_NAME = "wash24-push-server";

function serverDb() {
    const app =
        getApps().find((item) => item.name === SERVER_APP_NAME) ?? 
        initializeApp(firebaseOptions, SERVER_APP_NAME);
    return getFirestore(app);
}

const toText = (value: unknown) => (typeof value === "string" ? value : "");

function toPushState(value: unknown): PushNotificationRecord["push"] {
    if (!value || typeof value !== "object") return null;
    const push = value as Record<string, unknown>;
    const status = toText(push.status) as AppNotificationPush["status"];
    return status ? { status, startedAt: toText(push.startedAt) } : null;
}

function toRecord(id: string, data: Record<string, unknown>): PushNotificationRecord {
    return {
        id,
        title: toText(data.title),
        body: toText(data.body),
        type: toText(data.type) || (data.target === BROADCAST_TARGET ? "broadcast" : "personal"),
        target: toText(data.target),
        orderId: toText(data.orderId),
        outletId: toText(data.outletId),
        createdAt: toText(data.createdAt),
        push: toPushState(data.push),
    };
}

function tokensOf(phone: string, data: Record<string, unknown> | undefined): PushRecipient[] {
    const raw = data?.pushTokens;
    const tokens: unknown[] = Array.isArray(raw) ? raw : [];
    return tokens.filter(isExpoPushToken).map((token) => ({ token, phone }));
}

export function createFirestorePushDeps(accessToken: string | undefined): PushDeps {
    const db = serverDb();
    const notificationRef = (id: string) => doc(db, APP_NOTIFICATIONS_COLLECTION, id);

    return {
        now: () => new Date(),

        async load(id) {
            const snapshot = await getDoc(notificationRef(id));
            return snapshot.exists() ? toRecord(id, snapshot.data()) : null;
        },

        async claim(id, now) {
            return runTransaction(db, async (transaction) => {
                const snapshot = await transaction.get(notificationRef(id));
                if (!snapshot.exists()) return false;
                const record = toRecord(id, snapshot.data());
                if (!pushAttempt(record.push, record.createdAt, now).allowed) return false;
                const pending: AppNotificationPush = {
                    status: "pending",
                    sent: 0,
                    failed: 0,
                    removed: 0,
                    startedAt: now.toISOString(),
                    sentAt: "",
                    error: "",
                };
                transaction.update(notificationRef(id), { push: pending });
                return true;
            });
        },

        async recipients(notification) {
            if (notification.target === BROADCAST_TARGET) {
                const snapshot = await getDocs(collection(db, APP_CUSTOMER_COLLECTION));
                return snapshot.docs.flatMap((item) => {
                    const data = item.data();
                    const registeredAt = toText(data.createdAt);
                    if (registeredAt && notification.createdAt && registeredAt > notification.createdAt) {
                        return [];
                    }
                    return tokensOf(item.id, data);
                });
            }
            const snapshot = await getDoc(doc(db, APP_CUSTOMER_COLLECTION, notification.target));
            return snapshot.exists() ? tokensOf(notification.target, snapshot.data()) : [];
        },

        send: (messages) => sendExpoPush(messages, accessToken),

        async removeTokens(byPhone) {
            await Promise.allSettled(
                [...byPhone].map(([phone, tokens]) =>
                    updateDoc(doc(db, APP_CUSTOMER_COLLECTION, phone), {
                        pushTokens: arrayRemove(...tokens),
                    })
                )
            );
        },

        async save(id, push) {
            await updateDoc(notificationRef(id), { push });
        },
    };
}