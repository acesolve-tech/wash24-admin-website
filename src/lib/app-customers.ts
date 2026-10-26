import { db } from "@/config/firebase";
import { APP_CUSTOMER_COLLECTION, APP_CUSTOMER_RULES } from "@/constants/app-customers";
import { normalizePhone } from "@/lib/phone";
import { AppCustomer, AppCustomerInput } from "@/types/app-customer";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    runTransaction,
    serverTimestamp,
    Timestamp,
    updateDoc,
} from "firebase/firestore";

type Result<T> = { success: boolean; data: T; message: string };

const ALREADY_REGISTERED = "already-registered";

const toText = (value: unknown) => (typeof value === "string" ? value : "");

const toIso = (value: unknown) =>
    value instanceof Timestamp ? value.toDate().toISOString() : toText(value);

export function toAppCustomer(phone: string, data: Record<string, unknown>): AppCustomer {
    return {
        phone,
        name: toText(data.name),
        address: toText(data.address),
        birthDate: toText(data.birthDate),
        tier: data.tier === "VIP" ? "VIP" : "BASIC",
        points: typeof data.points === "number" ? data.points : 0,
        createdAt: toIso(data.createdAt) || toIso(data.serverCreatedAt),
        updatedAt: toIso(data.updatedAt),
        source: data.source === "admin" ? "admin" : "app",
        createdBy: toText(data.createdBy),
    };
}

function errorMessage(error: unknown, fallback: string) {
    const code = (error as { code?: string })?.code;
    if (code === "permission-denied") return "Akses ke data customer ditolak oleh Firebase.";
    if (code === "unavailable") return "Tidak ada koneksi ke server. Periksa internet lalu coba lagi.";
    return fallback;
}

export async function fetchAppCustomers(): Promise<Result<AppCustomer[]>> {
    try {
        const snapshot = await getDocs(collection(db, APP_CUSTOMER_COLLECTION));
        const customers = snapshot.docs
            .map((item) => toAppCustomer(item.id, item.data()))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return { success: true, data: customers, message: "" };
    } catch (error) {
        return {
            success: false,
            data: [],
            message: errorMessage(error, "Data customer gagal dimuat. Coba lagi."),
        };
    }
}

export async function fetchAppCustomer(phone: string): Promise<Result<AppCustomer | null>> {
    try {
        const snapshot = await getDoc(doc(db, APP_CUSTOMER_COLLECTION, phone));
        return {
            success: true,
            data: snapshot.exists() ? toAppCustomer(phone, snapshot.data()) : null,
            message: "",
        };
    } catch (error) {
        return {
            success: false,
            data: null,
            message: errorMessage(error, "Data customer gagal dimuat. Coba lagi."),
        };
    }
}

function ageOn(birth: Date, today: Date) {
    let age = today.getFullYear() - birth.getFullYear();
    const beforeBirthday =
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
    if (beforeBirthday) age -= 1;
    return age;
}

function validateBirthDate(value: string, today: Date): string | null {
    if (!value) return "Tanggal lahir wajib diisi.";
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return "Tanggal lahir tidak valid.";
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const birth = new Date(year, month - 1, day);
    const isRealDate =
        birth.getFullYear() === year && birth.getMonth() === month - 1 && birth.getDate() === day;
    if (!isRealDate || year < 1900) return "Tanggal lahir tidak valid.";
    if (birth > today) return "Tanggal lahir tidak boleh di masa depan.";
    if (ageOn(birth, today) < APP_CUSTOMER_RULES.minAge) {
        return `Usia minimal ${APP_CUSTOMER_RULES.minAge} tahun, sama seperti registrasi di app.`;
    }
    return null;
}

export function validateAppCustomerInput(
    input: AppCustomerInput,
    { withPhone, today = new Date() }: { withPhone: boolean; today?: Date }
): { value: AppCustomerInput; error: string | null } {
    const value: AppCustomerInput = {
        phone: withPhone ? normalizePhone(input.phone) ?? "" : input.phone,
        name: input.name.trim().replace(/\s+/g, " "),
        address: input.address.trim(),
        birthDate: input.birthDate.trim(),
    };
    const { nameMin, nameMax, addressMin, addressMax } = APP_CUSTOMER_RULES;
    const fail = (error: string) => ({ value, error });

    if (withPhone) {
        if (!input.phone.trim()) return fail("Nomor HP wajib diisi.");
        if (!value.phone) return fail("Nomor HP tidak valid. Contoh: 081234567890.");
    }
    if (!value.name) return fail("Nama wajib diisi.");
    if (value.name.length < nameMin) return fail(`Nama minimal ${nameMin} karakter.`);
    if (value.name.length > nameMax) return fail(`Nama maksimal ${nameMax} karakter.`);
    if (!value.address) return fail("Alamat wajib diisi.");
    if (value.address.length < addressMin) return fail("Alamat terlalu singkat.");
    if (value.address.length > addressMax) return fail(`Alamat maksimal ${addressMax} karakter.`);
    const birthError = validateBirthDate(value.birthDate, today);
    if (birthError) return fail(birthError);
    return { value, error: null };
}

export async function createAppCustomer(
    input: AppCustomerInput,
    createdBy: string
): Promise<Result<{ phone: string; exists: boolean }>> {
    const { value, error } = validateAppCustomerInput(input, { withPhone: true });
    if (error) return { success: false, data: { phone: value.phone, exists: false }, message: error };

    const ref = doc(db, APP_CUSTOMER_COLLECTION, value.phone);
    const now = new Date().toISOString();

    try {
        await runTransaction(db, async (transaction) => {
            const existing = await transaction.get(ref);
            if (existing.exists()) throw new Error(ALREADY_REGISTERED);
            transaction.set(ref, {
                phone: value.phone,
                name: value.name,
                address: value.address,
                birthDate: value.birthDate,
                tier: "BASIC",
                points: 0,
                createdAt: now,
                updatedAt: now,
                serverCreatedAt: serverTimestamp(),
                source: "admin",
                createdBy,
            });
        });
        return { success: true, data: { phone: value.phone, exists: false }, message: "" };
    } catch (error) {
        if ((error as Error)?.message === ALREADY_REGISTERED) {
            return {
                success: false,
                data: { phone: value.phone, exists: true },
                message: "Nomor ini sudah terdaftar sebagai customer.",
            };
        }
        return {
            success: false,
            data: { phone: value.phone, exists: false },
            message: errorMessage(error, "Customer gagal didaftarkan. Coba lagi."),
        };
    }
}

export async function updateAppCustomer(
    phone: string,
    input: AppCustomerInput,
    updatedBy: string
): Promise<Result<null>> {
    const { value, error } = validateAppCustomerInput({ ...input, phone }, { withPhone: false });
    if (error) return { success: false, data: null, message: error };

    try {
        await updateDoc(doc(db, APP_CUSTOMER_COLLECTION, phone), {
            name: value.name,
            address: value.address,
            birthDate: value.birthDate,
            updatedAt: new Date().toISOString(),
            serverUpdatedAt: serverTimestamp(),
            updatedBy,
        });
        return { success: true, data: null, message: "" };
    } catch (error) {
        return {
            success: false,
            data: null,
            message: errorMessage(error, "Data customer gagal disimpan. Coba lagi."),
        };
    }
}