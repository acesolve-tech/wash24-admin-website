import { 
    PUSH_FRESH_MINUTES,
    PUSH_RETRY_HOURS,
    PUSH_STALE_PENDING_MINUTES,
} from "@/constants/push";
import { AppNotificationPush } from "@/types/app-notification";

const MINUTE = 60 * 1000;

const ageMs = (iso: string, now: Date) => {
    const time = new Date(iso).getTime();
    return Number.isNaN(time) ? Number.POSITIVE_INFINITY : now.getTime() - time;
};

export function pushAttempt(
    push: Pick<AppNotificationPush, "status" | "startedAt"> | null,
    createdAt: string,
    now: Date = new Date()
): { allowed: boolean; reason: string } {
    const age = ageMs(createdAt, now);

    if (!push) {
        return age <= PUSH_FRESH_MINUTES * MINUTE
            ? { allowed: true, reason: "" }
            : {
                allowed: false,
                reason: "Notifikasi ini dibuat sebelum push aktif atau sudah terlalu lama untuk dipush.",
            };
    }

    switch (push.status) {
        case "failed":
            return age <= PUSH_RETRY_HOURS * 60 * MINUTE
                ? { allowed: true, reason: "" }
                : { allowed: false, reason: `Push hanya bisa dikirim ulang dalam ${PUSH_RETRY_HOURS} jam.` };
        case "pending":
            return ageMs(push.startedAt, now) > PUSH_STALE_PENDING_MINUTES * MINUTE
                ? { allowed: true, reason: "" }
                : { allowed: false, reason: "Push untuk notifikasi ini sedang dikirim." };
        default:
            return { allowed: false, reason: "Push untuk notifikasi ini sudah diproses." };
    }
}