import { PushStatus } from "@/constants/push";

export type AppNotificationType = "broadcast" | "personal" | "order-status";

export type AppNotificationPush = {
    status: PushStatus;
    sent: number;
    failed: number;
    removed: number;
    startedAt: string;
    sentAt: string;
    error: string;
};

export type AppNotification = {
    id: string;
    title: string;
    body: string;
    target: string;
    type: AppNotificationType;
    orderId: string;
    outletId: string;
    createdAt: string;
    createdBy: string;
    push: AppNotificationPush | null;
};

export type AppNotificationInput = {
    title: string;
    body: string;
    target: string;
    orderId: string;
    outletId: string;
};