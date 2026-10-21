import { LocationKey } from "./locations";

export type AppOutlet = {
    id: string;
    name: string;
    city: string;
    branch: LocationKey;
};

export const APP_OUTLETS: AppOutlet[] = [
    { id: "tunjungan", name: "Tunjungan", city: "Surabaya", branch: "sby" },
    { id: "unesa", name: "Unesa", city: "Surabaya", branch: "sby2" },
    { id: "kertajaya", name: "Kertajaya", city: "Surabaya", branch: "sby3" },
    { id: "setiabudi", name: "Setiabudi", city: "Jakarta", branch: "jkt3" },
];

export const findAppOutlet = (id: string | null | undefined) =>
    APP_OUTLETS.find((outlet) => outlet.id === id);