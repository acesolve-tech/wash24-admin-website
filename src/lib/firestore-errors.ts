export type SubscriptionError = {
    message: string;
    indexUrl: string | null;
};

const errorCode = (error: unknown) => (error as { code?: string })?.code;

export function firestoreErrorMessage(error: unknown, fallback: string): string {
    const code = errorCode(error);
    if (code === "permission-denied") return "Akses ditolak oleh Firebase.";
    if (code === "unavailable") return "Tidak ada koneksi ke server. Periksa internet lalu coba lagi.";
    return fallback;
}

export function toSubscriptionError(error: unknown, fallback: string): SubscriptionError {
    if (errorCode(error) === "failed-precondition") {
        const message = (error as { message?: string })?.message ?? "";
        const indexUrl = /https:\/\/console\.firebase\.google\.com\S+/.exec(message)?.[0] ?? null;
        return {
            message:
                "Index Firestore untuk halaman ini belum dibuat. Klik link di bawah, lalu Create index. Tunggu 2–5 menit sampai statusnya Enabled, lalu muat ulang halaman ini.",
            indexUrl,
        };
    }
    return { message: firestoreErrorMessage(error, fallback), indexUrl: null };
}