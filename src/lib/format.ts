const rupiahFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
});

export const formatRupiah = (value: number) => rupiahFormatter.format(value);

export function formatDuration(hours: number): string {
    if (!Number.isFinite(hours) || hours <= 0) return "-";
    if (hours < 24) return `${hours} jam`;
    return `${Math.round(hours / 24)} hari`;
}

function toDate(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = dateOnly
        ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
        : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | Date | null | undefined): string {
    const date = toDate(value);
    return date ? dateFormatter.format(date) : "-";
}

export function formatDateTime(value: string | Date | null | undefined): string {
    const date = toDate(value);
    return date ? `${dateFormatter.format(date)}, ${timeFormatter.format(date)}` : "-";
}

export function formatQuantity(quantity: number, unit: string): string {
    const amount = quantity.toLocaleString("id-ID", { maximumFractionDigits: 2 });
    return unit ? `${amount} ${unit}` : amount;
}