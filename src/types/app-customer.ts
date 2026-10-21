export type AppCustomerTier = "BASIC" | "VIP";

export type AppCustomer = {
    phone: string;
    name: string;
    address: string;
    birthDate: string;
    tier: AppCustomerTier;
    points: number;
    createdAt: string;
    updatedAt: string;
    source: "app" | "admin";
    createdBy: string;
};

export type AppCustomerInput = {
    phone: string;
    name: string;
    address: string;
    birthDate: string;
};