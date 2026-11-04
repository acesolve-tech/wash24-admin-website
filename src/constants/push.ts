export const PUSH_API_PATH = "/api/push";

export const EXPO_PUSH_SEND_URL = "https://exp.host/--/api/v2/push/send";

export const EXPO_PUSH_CHUNK_SIZE = 100;

export const PUSH_CHANNEL_ID = "default";

export const PUSH_FRESH_MINUTES = 30;

export const PUSH_RETRY_HOURS = 24;

export const PUSH_STALE_PENDING_MINUTES = 5;

export type PushStatus = "pending" | "sent" | "partial" | "failed" | "skipped";

export const PUSH_STATUS_LABEL: Record<PushStatus, { label: string; className: string }> = {
    pending: { label: "Push dikirim...", className: "text-gray-500" },
    sent: { label: "Push terkirim", className: "text-emerald-700" },
    partial: { label: "Push sebagian", className: "text-amber-700" },
    failed: { label: "Push gagal", className: "text-red-600" },
    skipped: { label: "Tanpa push", className: "text-gray-500" },
};