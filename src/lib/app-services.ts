import { db } from "@/config/firebase";
import {
    APP_SERVICE_LIMITS,
    APP_SERVICE_SEED,
    APP_SERVICES_COLLECTION,
    SORT_ORDER_STEP,
} from "@/constants/app-services";
import { AppService, AppServiceInput, AppServiceUnit } from "@/types/app-service";
import {
    addDoc,
    collection,
    doc,
    getDocs,
    serverTimestamp,
    Timestamp,
    updateDoc,
    writeBatch,
} from "firebase/firestore";

type Result<T> = { success: boolean; data: T; message: string };

const servicesRef = () => collection(db, APP_SERVICES_COLLECTION);

const UNITS: AppServiceUnit[] = ["kg", "pcs"];

const toNumber = (value: unknown, fallback = 0) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toText = (value: unknown) => (typeof value === "string" ? value : "");

function toAppService(id: string, data: Record<string, unknown>): AppService {
    return {
        id,
        name: toText(data.name),
        icon: toText(data.icon),
        price: toNumber(data.price),
        unit: UNITS.includes(data.unit as AppServiceUnit) ? (data.unit as AppServiceUnit) : "pcs",
        description: toText(data.description),
        durationHours: toNumber(data.durationHours),
        active: data.active !== false,
        sortOrder: toNumber(data.sortOrder, Number.MAX_SAFE_INTEGER),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null,
        updatedBy: toText(data.updatedBy),
    };
}

const byDisplayOrder = (a: AppService, b: AppService) =>
    a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id");

function errorMessage(error: unknown, fallback: string) {
    const code = (error as { code?: string })?.code;
    if (code === "permission-denied") return "Akses ke data layanan ditolak oleh Firebase.";
    if (code === "unavailable") return "Tidak ada koneksi ke server. Periksa internet lalu coba lagi.";
    return fallback;
}

export async function fetchAppServices(): Promise<Result<AppService[]>> {
    try {
        const snapshot = await getDocs(servicesRef());
        const services = snapshot.docs
            .map((item) => toAppService(item.id, item.data()))
            .sort(byDisplayOrder);
        return { success: true, data: services, message: "" };
    } catch (error) {
        return {
            success: false,
            data: [],
            message: errorMessage(error, "Data layanan gagal dimuat. Coba lagi."),
        };
    }
}

export function validateAppServiceInput(
    input: AppServiceInput,
    others: AppService[]
): { value: AppServiceInput; error: string | null } {
    const value: AppServiceInput = {
        ...input,
        name: input.name.trim().replace(/\s+/g, " "),
        description: input.description.trim().replace(/\s+/g, " "),
    };
    const { nameMax, descriptionMax, priceMax, durationMaxHours } = APP_SERVICE_LIMITS;

    const fail = (error: string) => ({ value, error });

    if (!value.name) return fail("Nama layanan wajib diisi.");
    if (value.name.length > nameMax) return fail(`Nama layanan maksimal ${nameMax} karakter.`);
    const lowerName = value.name.toLowerCase();
    if (others.some((service) => service.name.trim().toLowerCase() === lowerName)) {
        return fail("Nama layanan sudah dipakai layanan lain.");
    }
    if (!Number.isInteger(value.price) || value.price <= 0) {
        return fail("Harga harus lebih dari 0.");
    }
    if (value.price > priceMax) return fail("Harga terlalu besar, periksa lagi angkanya.");
    if (!UNITS.includes(value.unit)) return fail("Pilih satuan kg atau pcs.");
    if (!Number.isInteger(value.durationHours) || value.durationHours <= 0) {
        return fail("Estimasi pengerjaan harus lebih dari 0.");
    }
    if (value.durationHours > durationMaxHours) {
        return fail(`Estimasi pengerjaan maksimal ${durationMaxHours / 24} hari.`);
    }
    if (!value.icon) return fail("Pilih ikon layanan.");
    if (!value.description) return fail("Deskripsi wajib diisi, karena tampil di app.");
    if (value.description.length > descriptionMax) {
        return fail(`Deskripsi maksimal ${descriptionMax} karakter.`);
    }
    return { value, error: null };
}

export async function saveAppService(
    id: string | null,
    input: AppServiceInput,
    services: AppService[],
    updatedBy: string
): Promise<Result<null>> {
    const others = services.filter((service) => service.id !== id);
    const { value, error } = validateAppServiceInput(input, others);
    if (error) return { success: false, data: null, message: error };

    try {
        if (id) {
            await updateDoc(doc(db, APP_SERVICES_COLLECTION, id), {
                ...value,
                updatedAt: serverTimestamp(),
                updatedBy,
            });
        } else {
            const lastOrder = services.reduce(
                (max, service) =>
                    service.sortOrder === Number.MAX_SAFE_INTEGER ? max : Math.max(max, service.sortOrder),
                0
            );
            await addDoc(servicesRef(), {
                ...value,
                sortOrder: lastOrder + SORT_ORDER_STEP,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                updatedBy,
            });
        }
        return { success: true, data: null, message: "" };
    } catch (error) {
        return {
            success: false,
            data: null,
            message: errorMessage(error, "Layanan gagal disimpan. Coba lagi."),
        };
    }
}

export async function moveAppService(
    services: AppService[],
    index: number,
    direction: -1 | 1,
    updatedBy: string
): Promise<Result<AppService[]>> {
    const target = index + direction;
    if (target < 0 || target >= services.length) {
        return { success: true, data: services, message: "" };
    }

    const reordered = [...services];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const renumbered = reordered.map((service, i) => ({
        ...service,
        sortOrder: (i + 1) * SORT_ORDER_STEP,
    }));

    try {
        const batch = writeBatch(db);
        renumbered.forEach((service, i) => {
            if (service.sortOrder !== reordered[i].sortOrder) {
                batch.update(doc(db, APP_SERVICES_COLLECTION, service.id), {
                    sortOrder: service.sortOrder,
                    updateAt: serverTimestamp(),
                    updatedBy,
                });
            }
        });
        await batch.commit();
        return { success: true, data: renumbered, message: "" };
    } catch (error) {
        return {
            success: false,
            data: services,
            message: errorMessage(error, "Urutan gagal disimpan. Coba lagi."),
        };
    }
}

export async function seedAppServices(updatedBy: string): Promise<Result<null>> {
    try {
        const existing = await getDocs(servicesRef());
        if (!existing.empty) {
            return {
                success: false,
                data: null,
                message: "Katalog sudah berisi layanan. Muat ulang halaman.",
            };
        }

        const batch = writeBatch(db);
        APP_SERVICE_SEED.forEach(({ id, ...service }, index) => {
            batch.set(doc(db, APP_SERVICES_COLLECTION, id), {
                ...service,
                sortOrder: (index + 1) * SORT_ORDER_STEP,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                updatedBy,
            });
        });
        await batch.commit();
        return { success: true, data: null, message: "" };
    } catch (error) {
        return {
            success: false,
            data: null,
            message: errorMessage(error, "Data awal gagal disimpan. Coba lagi."),
        };
    }
}