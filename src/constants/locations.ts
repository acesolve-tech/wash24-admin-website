export type LocationKey =
    | "mlg"
    | "sby"
    | "sby2"
    | "sby3"
    | "sby4"
    | "jkt3"
    | "jkt4"
    | "hotel-n-karpet";

export type Location = {
    title: string;
    key: LocationKey;
    collectionName: string;
    city: string;
    active: boolean;
};

export const ALL_LOCATIONS: Location[] = [
    { title: "Malang", key: "mlg", collectionName: "malang", city: "Malang", active: true },
    { title: "Surabaya Pusat", key: "sby", collectionName: "surabaya", city: "Surabaya", active: true },
    { title: "Surabaya Barat", key: "sby2", collectionName: "surabaya-2", city: "Surabaya", active: true },
    { title: "Surabaya Timur", key: "sby3", collectionName: "surabaya-3", city: "Surabaya", active: true },
    { title: "Surabaya Selatan", key: "sby4", collectionName: "surabaya-4", city: "Surabaya", active: false },
    { title: "Jakarta Selatan", key: "jkt3", collectionName: "jakarta-3", city: "Jakarta", active: true },
    { title: "Jakarta Pusat", key: "jkt4", collectionName: "jakarta-4", city: "Jakarta", active: false },
    { title: "Hotel dan Karpet", key: "hotel-n-karpet", collectionName: "hotel-n-karpet", city: "Hotel Karpet", active: true },
];

export const LOCATIONS: Location[] = ALL_LOCATIONS.filter(
    (location) => location.active
);

export const STAFF_CITIES = ["Jakarta", "Surabaya", "Malang"];