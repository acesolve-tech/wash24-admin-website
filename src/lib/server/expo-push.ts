import { EXPO_PUSH_CHUNK_SIZE, EXPO_PUSH_SEND_URL, PUSH_CHANNEL_ID } from "@/constants/push";

export type ExpoPushMessage = {
    to: string;
    title: string;
    body: string;
    sound: "default";
    channelId: string;
    data: { notificationId: string; type: string; orderId?: string };
};

export type PushTicketResult = {
    token: string;
    ok: boolean;
    deviceNotRegistered: boolean;
    error: string;
};

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export const isExpoPushToken = (value: unknown): value is string =>
    typeof value === "string" && /^Expo(nent)?PushToken\[.+\]$/.test(value);

export function buildPushMessages(
    tokens: string[],
    notification: { id: string; title: string; body: string; type: string; orderId: string }
): ExpoPushMessage[] {
    const data: ExpoPushMessage["data"] = {
        notificationId: notification.id,
        type: notification.type,
        ...(notification.orderId ? { orderId: notification.orderId } : {}),
    };
    return tokens.map((to) => ({
        to,
        title: notification.title,
        body: notification.body,
        sound: "default",
        channelId: PUSH_CHANNEL_ID,
        data,
    }));
}

export function chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
    return chunks;
}

function requestErrorMessage(status: number, body: unknown): string {
    const first = (body as { errors?: { code?: string; message?: string }[] })?.errors?.[0];
    if (status === 401 || status === 403) {
        return "Expo menolak access token. Periksa EXPO_ACCESS_TOKEN (harus dari akun pemilik Project Expo).";
    }
    if (status === 429) return "Terlalu banyak push dalam waktu singkat. Coba kirim ulang sebentar lagi.";
    return first?.message ? `Expo: ${first.message}` : `Expo membalas status ${status}.`;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function postChunk(
    messages: ExpoPushMessage[],
    accessToken: string,
    fetchImpl: FetchLike
): Promise<{ ok: true; tickets: unknown[] } | { ok: false; error: string }> {
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const response = await fetchImpl(EXPO_PUSH_SEND_URL, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Accept-Encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(messages),
            });
            const body = await response.json().catch(() => null);
            if (response.ok && Array.isArray((body as { data?: unknown })?.data)) {
                return { ok: true, tickets: (body as { data: unknown[] }).data };
            }
            const retryable = response.status === 429 || response.status >= 500;
            if (!retryable || attempt === 1) {
                return { ok: false, error: requestErrorMessage(response.status, body) };
            }
        } catch {
            if (attempt === 1) return { ok: false, error: "Gagal menghubungi Expo Push Service." };
        }
        await sleep(1000);
    }
    return { ok: false, error: "Gagal menghubungi Expo Push Service." };
}

export async function sendExpoPush(
    messages: ExpoPushMessage[],
    accessToken: string | undefined,
    fetchImpl: FetchLike = fetch
): Promise<PushTicketResult[]> {
    if (!accessToken) {
        return messages.map((message) => ({
            token: message.to,
            ok: false,
            deviceNotRegistered: false,
            error: "EXPO_ACCESS_TOKEN belum diatur di server.",
        }));
    }

    const results: PushTicketResult[] = [];
    for (const part of chunk(messages, EXPO_PUSH_CHUNK_SIZE)) {
        const response = await postChunk(part, accessToken, fetchImpl);
        part.forEach((message, index) => {
            if (!response.ok) {
                results.push({ token: message.to, ok: false, deviceNotRegistered: false, error: response.error });
                return;
            }
            const ticket = response.tickets[index] as
                | { status?: string; message?: string; details?: { error?: string } }
                | undefined;
            if (ticket?.status === "ok") {
                results.push({ token: message.to, ok: true, deviceNotRegistered: false, error: "" });
                return;
            }
            const code = ticket?.details?.error ?? "";
            results.push({
                token: message.to,
                ok: false,
                deviceNotRegistered: code === "DeviceNotRegistered",
                error: code === "DeviceNotRegistered"
                    ? "HP sudah tidak terdaftar (app dihapus / permission dicabut)."
                    : ticket?.message || code || "Expo tidak mengembalikan tiket.",
            });
        });
    }
    return results;
}