import { AccessUser, canManageAppNotification } from "@/config/access";
import { pushAttempt } from "@/lib/push-rules";
import { AppNotificationPush } from "@/types/app-notification";
import { buildPushMessages, ExpoPushMessage, PushTicketResult } from "./expo-push";

export type PushNotificationRecord = {
    id: string;
    title: string;
    body: string;
    type: string;
    target: string;
    orderId: string;
    outletId: string;
    createdAt: string;
    push: Pick<AppNotificationPush, "status" | "startedAt"> | null;
};

export type PushRecipient = { token: string; phone: string };

export type PushDeps = {
    load: (id: string) => Promise<PushNotificationRecord | null>;
    claim: (id: string, now: Date) => Promise<boolean>;
    recipients: (notification: PushNotificationRecord) => Promise<PushRecipient[]>;
    send: (messages: ExpoPushMessage[]) => Promise<PushTicketResult[]>;
    removeTokens: (byPhone: Map<string, string[]>) => Promise<void>;
    save: (id: string, push: AppNotificationPush) => Promise<void>;
    now: () => Date;
};

export type PushDispatchResult = {
    httpStatus: number;
    body: { ok: boolean; message: string; push?: AppNotificationPush };
};

const fail = (httpStatus: number, message: string): PushDispatchResult => ({
    httpStatus,
    body: { ok: false, message },
});

export function summarizePush(
    results: PushTicketResult[],
    removed: number,
    startedAt: string,
    now: Date,
): AppNotificationPush {
    const sent = results.filter((result) => result.ok).length;
    const failed = results.length - sent;
    const firstError = results.find((result) => !result.ok)?.error ?? "";
    return {
        status: results.length === 0 ? "skipped" : failed === 0 ? "sent" : sent === 0 ? "failed" : "partial",
        sent,
        failed,
        removed,
        startedAt,
        sentAt: now.toISOString(),
        error:
            results.length === 0
                ? "Penerima belum punya HP yang mengizinkan notifikasi."
                : firstError,
    };
}

function groupRecipients(recipients : PushRecipient[]) {
    const owners = new Map<string, string[]>();
    for (const { token, phone } of recipients) {
        owners.set(token, [...(owners.get(token) ?? []), phone]);
    }
    return owners;
}

export async function dispatchPush(
    notificationId: string,
    actor: AccessUser,
    deps: PushDeps
): Promise<PushDispatchResult> {
    const notification = await deps.load(notificationId);
    if (!notification) return fail(404, "Notifikasi tidak ditemukan.");

    if (!canManageAppNotification(actor, notification)) {
        return fail(403, "Akun ini tidak boleh mengirim push untuk notifikasi tersebut.");
    }

    const now = deps.now();
    const attempt = pushAttempt(notification.push, notification.createdAt, now);
    if (!attempt.allowed) return fail(409, attempt.reason);

    if (!(await deps.claim(notificationId, now))) {
        return fail(409, "Push untuk notifikasi ini sedang atau sudah diproses.");
    }

    const startedAt = now.toISOString();
    try {
        const owners = groupRecipients(await deps.recipients(notification));
        const tokens = [...owners.keys()];
        const results = tokens.length
            ? await deps.send(buildPushMessages(tokens, notification))
            : [];
        
        const deadByPhone = new Map<string, string[]>();
        for (const result of results) {
            if (!result.deviceNotRegistered) continue;
            for (const phone of owners.get(result.token) ?? []) {
                deadByPhone.set(phone, [...(deadByPhone.get(phone) ?? []), result.token]);
            }
        }
        const removed = results.filter((result) => result.deviceNotRegistered).length;
        if (deadByPhone.size > 0) await deps.removeTokens(deadByPhone);

        const push = summarizePush(results, removed, startedAt, deps.now());
        await deps.save(notificationId, push);
        return {
            httpStatus: 200,
            body: { ok: push.status === "sent" || push.status === "partial" || push.status === "skipped", message: "", push },
        };
    } catch (error) {
        const push: AppNotificationPush = {
            status: "failed",
            sent: 0,
            failed: 0,
            removed: 0,
            startedAt,
            sentAt: deps.now().toISOString(),
            error: "Terjadi kesalahan di server saat mengirim push.",
        };
        console.error("[push] dispatch gagal", notificationId, error);
        await deps.save(notificationId, push).catch(() => undefined);
        return { httpStatus: 500, body: { ok: false, message: push.error, push } };
    }
}