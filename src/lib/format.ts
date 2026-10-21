const rupiahFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

export const formatRupiah = (value: number) => rupiahFormatter.format(value);

export function formatDuration(hours: number): string {
    if (!Number.isFinite(hours) || hours <= 0) return "-";
    if (hours < 24) return `${hours} jam`;
    return `${Math.round(hours / 24)} hari`;
}