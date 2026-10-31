"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Loading from "@/components/Loading";
import { AppOrderStatusBadge } from "@/components/app-order-card";
import AppOrderForm from "@/components/popup/app-order-form";
import AppCustomerForm from "@/components/popup/app-customer-form";
import SubscriptionErrorAlert from "@/components/subscription-error-alert";
import { getAppOutlets } from "@/config/access";
import { ACTIVE_ORDER_STATUSES, APP_ORDER_PAGE_SIZE, APP_ORDER_STATUS, APP_ORDER_STATUSES } from "@/constants/app-orders";
import { fetchAppCustomers } from "@/lib/app-customers";
import { subscribeOutletOrders } from "@/lib/app-orders";
import { SubscriptionError } from "@/lib/firestore-errors";
import { fetchAppServices } from "@/lib/app-services";
import { formatDateTime, formatQuantity, formatRupiah } from "@/lib/format";
import { formatPhoneDisplay, phoneMatches } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { userStore } from "@/store/user";
import { AppCustomer } from "@/types/app-customer";
import { AppOrder, AppOrderStatus } from "@/types/app-order";
import { AppService } from "@/types/app-service";

type StatusFilter = "active" | "all" | AppOrderStatus;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: "active", label: "Aktif" },
    ...APP_ORDER_STATUSES.map((status) => ({ value: status, label: APP_ORDER_STATUS[status].label })),
    { value: "all", label: "Semua" },
];

const matchesStatus = (order: AppOrder, filter: StatusFilter) =>
    filter === "all" ||
    (filter === "active" ? ACTIVE_ORDER_STATUSES.includes(order.status) : order.status === filter);

function itemSummary(order: AppOrder) {
    if (order.items.length === 0) return "-";
    const [first, ...rest] = order.items;
    const head = `${first.itemName} ${formatQuantity(first.quantity, first.unit)}`;
    return rest.length > 0 ? `${head}, +${rest.length} item` : head;
}

type FormState = { open: false } | { open: true; order: AppOrder | null };

const AppOrdersPage = () => {
    const user = userStore((state: any) => state.user);
    const outlets = useMemo(() => getAppOutlets(user), [user]);
    const outletKey = outlets.map((outlet) => outlet.id).join(",");

    const [orders, setOrders] = useState<AppOrder[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [max, setMax] = useState(APP_ORDER_PAGE_SIZE);
    const [ordersLoaded, setOrdersLoaded] = useState(false);
    const [ordersError, setOrdersError] = useState<SubscriptionError | null>(null);

    const [customers, setCustomers] = useState<AppCustomer[]>([]);
    const [services, setServices] = useState<AppService[]>([]);
    const [refError, setRefError] = useState("");

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
    const [outletFilter, setOutletFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [form, setForm] = useState<FormState>({ open: false });
    const [customerFormOpen, setCustomerFormOpen] = useState(false);
    const [registeredPhone, setRegisteredPhone] = useState<string | undefined>();

    useEffect(() => {
        if (!user.role) return;
        const outletIds = outletKey ? outletKey.split(",") : [];
        return subscribeOutletOrders(
            outletIds,
            max,
            (data, more) => {
                setOrders(data);
                setHasMore(more);
                setOrdersError(null);
                setOrdersLoaded(true);
            },
            (error) => {
                setOrdersError(error);
                setOrdersLoaded(true);
            }
        );
    }, [user.role, outletKey, max]);

    const loadReferences = useCallback(async () => {
        const [customerResult, serviceResult] = await Promise.all([
            fetchAppCustomers(),
            fetchAppServices(),
        ]);
        setCustomers(customerResult.data);
        setServices(serviceResult.data);
        setRefError(
            !customerResult.success
                ? customerResult.message
                : !serviceResult.success
                    ? serviceResult.message
                    : ""
        );
    }, []);

    useEffect(() => {
        loadReferences();
    }, [loadReferences]);

    const customerByPhone = useMemo(
        () => new Map(customers.map((customer) => [customer.phone, customer])),
        [customers]
    );

    const searched = useMemo(() => {
        const query = search.trim().toLowerCase();
        return orders.filter((order) => {
            if (outletFilter !== "all" && order.outletId !== outletFilter) return false;
            if (!query) return true;
            const name = customerByPhone.get(order.customerPhone)?.name.toLowerCase() ?? "";
            return (
                order.id.toLowerCase().includes(query) ||
                name.includes(query) ||
                phoneMatches(order.customerPhone, query)
            );
        });
    }, [orders, outletFilter, search, customerByPhone]);

    const visible = searched.filter((order) => matchesStatus(order, statusFilter));
    const countFor = (filter: StatusFilter) =>
        searched.filter((order) => matchesStatus(order, filter)).length;

    const closeForm = useCallback(() => {
        setForm({ open: false });
        setRegisteredPhone(undefined);
    }, []);
    const closeCustomerForm = useCallback(() => setCustomerFormOpen(false), []);
    const showOutletColumn = outlets.length > 1;

    return (
        <div className="min-h-[calc(100dvh-40px)] space-y-6">
            <div className="space-y-1 pr-24">
                <Label className="text-3xl font-bold w-fit">Pesanan App</Label>
                <p className="text-sm text-gray-600">
                    Pesanan dari checkout app dan yang dicatat admin
                    {outlets.length === 1 ? ` di outlet ${outlets[0].name}` : ""}. Daftar diperbarui
                    otomatis.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-80">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Cari no. pesanan, nama, atau nomor HP"
                        aria-label="Cari pesanan"
                        className="pl-9"
                    />
                </div>
                {showOutletColumn && (
                    <ToggleGroup
                        type="single"
                        value={outletFilter}
                        onValueChange={(value) => value && setOutletFilter(value)}
                        aria-label="Filter outlet"
                        className="flex-wrap border rounded-md py-1 px-2 gap-1 bg-white"
                    >
                        <ToggleGroupItem value="all" className="flex-none px-3 h-fit py-1 cursor-pointer">
                            Semua outlet
                        </ToggleGroupItem>
                        {outlets.map((outlet) => (
                            <ToggleGroupItem
                                key={outlet.id}
                                value={outlet.id}
                                className="flex-none px-3 h-fit py-1 cursor-pointer"
                            >
                                {outlet.name}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                )}
                <button
                    type="button"
                    onClick={() => setForm({ open: true, order: null })}
                    className="cursor-pointer ml-auto bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-1.5 rounded-md"
                >
                    + Buat Pesanan
                </button>
            </div>

            <div role="tablist" aria-label="Filter status" className="flex gap-2 overflow-x-auto pb-1">
                {STATUS_TABS.map((tab) => {
                    const selected = statusFilter === tab.value;
                    return (
                        <button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setStatusFilter(tab.value)}
                            className={cn(
                                "shrink-0 rounded-full border px-3 py-1 text-sm cursor-pointer",
                                selected
                                    ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                            )}
                        >
                            {tab.label}
                            <span className={cn("ml-1.5 text-xs", selected ? "text-white/80" : "text-gray-400")}>
                                {countFor(tab.value)}
                            </span>
                        </button>
                    );
                })}
            </div>

            {ordersError && <SubscriptionErrorAlert error={ordersError} />}
            {refError && (
                <p role="alert" className="text-sm text-red-600">
                    {refError}{" "}
                    <button type="button" onClick={loadReferences} className="font-semibold underline cursor-pointer">
                        Muat ulang
                    </button>
                </p>
            )}

            {ordersLoaded && !ordersError && (
                <div className="rounded-md border w-full bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pesanan</TableHead>
                                <TableHead>Customer</TableHead>
                                {showOutletColumn && <TableHead className="hidden lg:table-cell">Outlet</TableHead>}
                                <TableHead className="hidden md:table-cell">Item</TableHead>
                                <TableHead className="hidden sm:table-cell text-right">Total</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((order) => {
                                const customer = customerByPhone.get(order.customerPhone);
                                return (
                                    <TableRow
                                        key={`${order.customerPhone}/${order.id}`}
                                        onClick={() => setForm({ open: true, order })}
                                        className="cursor-pointer"
                                    >
                                        <TableCell className="whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setForm({ open: true, order });
                                                }}
                                                className="font-semibold tracking-wide text-gray-900 hover:underline cursor-pointer"
                                            >
                                                {order.id}
                                            </button>
                                            <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={`/app-customers/${order.customerPhone.replace(/\D/g, "")}`}
                                                onClick={(event) => event.stopPropagation()}
                                                className="font-medium text-gray-900 hover:underline"
                                            >
                                                {customer?.name || "(customer tidak ditemukan)"}
                                            </Link>
                                            <p className="text-xs text-gray-500 whitespace-nowrap">
                                                {formatPhoneDisplay(order.customerPhone)}
                                            </p>
                                            <p className="sm:hidden text-xs text-gray-700">{formatRupiah(order.total)}</p>
                                        </TableCell>
                                        {showOutletColumn && (
                                            <TableCell className="hidden lg:table-cell">{order.outletName || "-"}</TableCell>
                                        )}
                                        <TableCell className="hidden md:table-cell text-gray-700">
                                            {itemSummary(order)}
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-right whitespace-nowrap">
                                            {formatRupiah(order.total)}
                                        </TableCell>
                                        <TableCell>
                                            <AppOrderStatusBadge status={order.status} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {visible.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                        {search.trim() || outletFilter !== "all"
                                            ? "Tidak ada pesanan yang cocok."
                                            : statusFilter === "active"
                                                ? "Tidak ada pesanan aktif."
                                                : "Belum ada pesanan."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {hasMore && !ordersError && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => setMax((current) => current + APP_ORDER_PAGE_SIZE)}
                        className="cursor-pointer rounded-md border border-gray-300 px-5 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Muat pesanan lebih lama
                    </button>
                </div>
            )}

            {form.open && (
                <AppOrderForm
                    order={form.order}
                    customer={form.order ? customerByPhone.get(form.order.customerPhone) ?? null : null}
                    customers={customers}
                    services={services}
                    outlets={outlets}
                    actorEmail={user.email}
                    registeredPhone={registeredPhone}
                    onRegisterCustomer={() => setCustomerFormOpen(true)}
                    onClose={closeForm}
                    onSaved={closeForm}
                />
            )}
            {customerFormOpen && (
                <AppCustomerForm
                    customer={null}
                    actorEmail={user.email}
                    onClose={closeCustomerForm}
                    onSaved={async (phone) => {
                        setCustomerFormOpen(false);
                        await loadReferences();
                        setRegisteredPhone(phone);
                    }}
                />
            )}
            {!ordersLoaded && <Loading />}
        </div>
    );
};

export default AppOrdersPage;