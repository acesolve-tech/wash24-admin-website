export type AppServiceUnit = "kg" | "pcs";

export type AppService = {
    id: string;
    name: string;
    icon: string;
    price: number;
    unit: AppServiceUnit;
    description: string;
    durationHours: number;
    active: boolean;
    sortOrder: number;
    updatedAt: Date | null;
    updatedBy: string;
};

export type AppServiceInput = Pick<
    AppService,
    "name" | "icon" | "price" | "unit" | "description" | "durationHours" | "active"
>;