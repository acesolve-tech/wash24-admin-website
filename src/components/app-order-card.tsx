import { Pen } from "lucide-react";
import { APP_ORDER_METHOD_LABEL, APP_ORDER_STATUS } from "@/constants/app-orders";
import { formatDateTime, formatQuantity, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppOrder, AppOrderStatus } from "@/types/app-order";

export function AppOrderStatusBadge({ status }: { status: AppOrderStatus }) {
    const meta = APP_ORDER_STATUS[status];
    return (
        <span
            className={cn(
                "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                meta.className
            )}
        >
            {meta.label}
        </span>
    );
}

export default function AppOrderCard({
    order,
    onEdit,
}: {
    order: AppOrder;
    onEdit?: () => void;
}) {
    const isPickup = order.method === "pickup";

    return (
        <article className="rounded-md border bg-white p-4 space-y-3">
            <header className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-wide text-gray-900">{order.id}</p>
                    <p className="text-xs text-gray-500">
                        {formatDateTime(order.createdAt)}
                        {order.outletName ? ` · Outlet ${order.outletName}` : " · Tanpa outlet"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <AppOrderStatusBadge status={order.status} />
                    {onEdit && (
                        <button
                            type="button"
                            onClick={onEdit}
                            aria-label={`Ubah pesanan ${order.id}`}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                            <Pen className="size-3" />
                            Ubah
                        </button>
                    )}
                </div>
            </header>

            <ul className="space-y-1 text-sm">
                {order.items.length === 0 && <li className="text-gray-500">Belum ada item.</li>}
                {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3">
                        <span className="min-w-0 text-gray-700">
                            {item.itemName}
                            <span className="text-gray-500">
                                {" "}
                                · {formatQuantity(item.quantity, item.unit)} x {formatRupiah(item.price)}
                            </span>
                        </span>
                        <span className="shrink-0 text-gray-900">
                            {formatRupiah(Math.round(item.price * item.quantity))}
                        </span>
                    </li>
                ))}
            </ul>

            <dl className="border-t pt-2 text-sm space-y-0.5">
                <div className="flex justify-between gap-3 text-gray-600">
                    <dt>Subtotal</dt>
                    <dd>{formatRupiah(order.subtotal)}</dd>
                </div>
                {isPickup && (
                    <div className="flex justify-between gap-3 text-gray-600">
                        <dt>Antar jemput</dt>
                        <dd>{order.deliveryFee === 0 ? "Gratis" : formatRupiah(order.deliveryFee)}</dd>
                    </div>
                )}
                <div className="flex justify-between gap-3 font-semibold text-gray-900">
                    <dt>Total</dt>
                    <dd>{formatRupiah(order.total)}</dd>
                </div>
            </dl>

            <div className="text-xs text-gray-600 space-y-0.5">
                <p>Metode: {APP_ORDER_METHOD_LABEL[order.method]}</p>
                {isPickup && order.pickupAddress && <p>Alamat jemput: {order.pickupAddress}</p>}
                {order.note && <p>Catatan: {order.note}</p>}
            </div>
        </article>
    );
}