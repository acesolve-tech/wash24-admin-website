import { Smartphone } from "lucide-react";
import { PUSH_STATUS_LABEL } from "@/constants/push";
import { pushAttempt } from "@/lib/push-rules";
import { cn } from "@/lib/utils";
import { AppNotification } from "@/types/app-notification";

function describe(notification: AppNotification): string {
    const push = notification.push;
    if (!push) return "Push belum dikirim";
    const removed = push.removed > 0 ? ` · ${push.removed} HP tidak aktif dibersihkan` : "";
    switch (push.status) {
        case "pending":
            return "Push sedang dikirim...";
        case "sent":
            return `Push terkirim ke ${push.sent} HP${removed}`;
        case "partial":
            return `Push terkirim ke ${push.sent} HP, gagal ${push.failed}${removed}`;
        case "failed":
            return `Push gagal${push.error ? `: ${push.error}` : ""}`;
        case "skipped":
            return `Tanpa push${push.error ? `: ${push.error}` : ""}`;
    }
}

export default function AppNotificationPushStatus({
    notification,
    retrying,
    onRetry,
}: {
    notification: AppNotification;
    retrying: boolean;
    onRetry: () => void;
}) {
    const { push, createdAt } = notification;
    const attempt = pushAttempt(push, createdAt);

    if (!push && !attempt.allowed) return null;

    const tone = push ? PUSH_STATUS_LABEL[push.status].className : "text-gray-500";

    return (
        <p className={cn("mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs", tone)}>
            <Smartphone className="size-3.5 shrink-0" aria-hidden />
            <span className="break-words">{describe(notification)}</span>
            {attempt.allowed && (
                <button
                    type="button"
                    onClick={onRetry}
                    disabled={retrying}
                    className="font-semibold text-[var(--primary-color)] hover:underline cursor-pointer disabled:opacity-50"
                >
                    {retrying ? "Mengirim..." : push ? "Kirim ulang push" : "Kirim push"}
                </button>
            )}
        </p>
    );
}