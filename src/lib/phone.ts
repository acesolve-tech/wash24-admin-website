const COUNTRY_CODE = "62";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export function normalizePhone(input: string): string | null {
    let digits = digitsOnly(input);
    if (!digits) return null;

    if (digits.startsWith("0")) {
        digits = COUNTRY_CODE + digits.slice(1);
    } else if (!digits.startsWith(COUNTRY_CODE)) {
        digits = COUNTRY_CODE + digits;
    }

    const local = digits.slice(COUNTRY_CODE.length);
    if (local.length < 9 || local.length > 13) return null;
    return "+" + digits;
}

export function formatPhoneDisplay(phone: string): string {
    const normalized = normalizePhone(phone);
    if (!normalized) return phone || "-";
    const local = normalized.slice(1 + COUNTRY_CODE.length);
    const parts = [local.slice(0, 3), local.slice(3, 7), local.slice(7)].filter(Boolean);
    return `+${COUNTRY_CODE} ${parts.join("-")}`;
}

export const whatsappUrl = (phone: string) => `https://wa.me/${digitsOnly(phone)}`;

export const phoneToRouteId = (phone: string) => digitsOnly(phone);

export function routeIdToPhone(id: string): string | null {
    const digits = digitsOnly(id);
    if (digits !== id || !digits.startsWith(COUNTRY_CODE)) return null;
    return normalizePhone(digits);
}

export function phoneMatches(phone: string, query: string): boolean {
    const q = digitsOnly(query);
    if (q.length < 3) return false;
    const target = digitsOnly(phone);
    if (target.includes(q)) return true;
    return q.startsWith("0") && target.includes(COUNTRY_CODE + q.slice(1));
}