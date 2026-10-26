export type AppOrderStatus = "pending" | "processing" | "ready" | "completed" | "cancelled";

export type AppOrderMethod = "pickup" | "dropoff";

export type AppOrderItem = {
    id: string;
    serviceId: string;
    serviceName: string;
    itemName: string;
    price: number;
    unit: string;
    quantity: number;
};

export type AppOrder = {
    id: string;
    customerPhone: string;
    createdAt: string;
    status: AppOrderStatus;
    method: AppOrderMethod;
    note: string;
    items: AppOrderItem[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    outletId: string;
    outletName: string;
    pickupAddress: string;
};