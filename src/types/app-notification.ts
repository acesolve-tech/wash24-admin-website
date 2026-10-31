export type AppNotificationType = "broadcast" | "personal" | "order-status";

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
};

export type AppNotificationInput = {
    title: string;
    body: string;
    target: string;
    orderId: string;
    outletId: string;
};