import { AppServiceInput, AppServiceUnit } from "@/types/app-service";

export const APP_SERVICES_COLLECTION = "app-services";

export const APP_SERVICE_UNITS: { value: AppServiceUnit; label: string }[] = [
    { value: "kg", label: "Per kg" },
    { value: "pcs", label: "Per pcs" },
];

export const APP_SERVICE_LIMITS = {
    nameMax: 40,
    descriptionMax: 160,
    priceMax: 10_000_000,
    durationMaxHours: 720,
};

export const SORT_ORDER_STEP = 10;

export const APP_SERVICE_SEED: (AppServiceInput & { id: string })[] = [
    {
        id: "s1",
        name: "Cuci Setrika",
        icon: "shirt-outline",
        price: 7000,
        unit: "kg",
        description: "Dicuci, dikeringkan, lalu disetrika rapi dan siap pakai.",
        durationHours: 48,
        active: true,
    },
    {
        id: "s2",
        name: "Cuci Lipat",
        icon: "water-outline",
        price: 5000,
        unit: "kg",
        description: "Dicuci bersih dan dikeringkan, tanpa proses setrika.",
        durationHours: 24,
        active: true,
    },
    {
        id: "s3",
        name: "Setrika",
        icon: "flame-outline",
        price: 4000,
        unit: "kg",
        description: "Khusus setrika untuk pakaian yang sudah bersih.",
        durationHours: 24,
        active: true,
    },
    {
        id: "s4",
        name: "Cuci Sepatu",
        icon: "footsteps-outline",
        price: 25000,
        unit: "pcs",
        description: "Deep clean sepatu, termasuk sol dan bagian dalam. Harga per pasang.",
        durationHours: 72,
        active: true,
    },
    {
        id: "s5",
        name: "Cuci Karpet",
        icon: "layers-outline",
        price: 20000,
        unit: "pcs",
        description: "Pembersihan karpet dengan mesin khusus dan pengeringan cepat.",
        durationHours: 96,
        active: true,
    },
    {
        id: "s6",
        name: "Bed Cover",
        icon: "bed-outline",
        price: 30000,
        unit: "pcs",
        description: "Cuci bed cover dan selimut tebal, dikeringkan menyeluruh.",
        durationHours: 72,
        active: true,
    },
];
