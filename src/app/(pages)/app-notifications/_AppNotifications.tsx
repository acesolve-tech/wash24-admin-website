"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Trash, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Loading from "@/components/Loading";
import SubscriptionErrorAlert from "@/components/subscription-error-alert";
import AppNotificationForm from "@/components/popup/app-notification-form";
import { canBroadcastNotification, getAppOutlets, isMaster } from "@/config/access";
import {
    APP_NOTIFICATION_PAGE_SIZE,
    APP_NOTIFICATION_TYPE,
    BROADCAST_TARGET,
    SYSTEM_SENDER,
} from "@/constants/app-notifications";
import { findAppOutlet } from "@/constants/app-outlets";
import { fetchAppCustomers } from "@/lib/app-customers";
import { deleteAppNotification, subscribeAppNotifications } from "@/lib/app-notifications";
import { SubscriptionError } from "@/lib/firestore-errors";
import { formatDateTime } from "@/lib/format";
import { formatPhoneDisplay, phoneMatches, phoneToRouteId } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { userStore } from "@/store/user";
import { AppCustomer } from "@/types/app-customer";
import { AppNotification, AppNotificationType } from "@/types/app-notification";

type TypeFilter = "all" | AppNotificationType;

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "Semua" },
    { value: "broadcast", label: APP_NOTIFICATION_TYPE.broadcast.label },
    { value: "personal", label: APP_NOTIFICATION_TYPE.personal.label },
    { value: "order-status", label: APP_NOTIFICATION_TYPE["order-status"].label },
];

const AppNotificationsPage = () => {
    const user = userStore((state: any) => state.user);
    const master = isMaster(user);
    const canBroadcast = canBroadcastNotification(user);
    const outlets = useMemo(() => getAppOutlets(user), [user]);
    const outletKey = outlets.map((outlet) => outlet.id).join(",");

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [max, setMax] = useState(APP_NOTIFICATION_PAGE_SIZE);
    const [loaded, setLoaded] = useState(false);
    const [listError, setListError] = useState<SubscriptionError | null>(null);

    const [customers, setCustomers] = useState<AppCustomer[]>([]);
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        if (!user.role) return;
        const outletIds = master ? null : outletKey ? outletKey.split(",") : [];
        return subscribeAppNotifications(
            outletIds,
            max,
            (data, more) => {
                setNotifications(data);
                setHasMore(more);
                setListError(null);
                setLoaded(true);
            },
            (error) => {
                setListError(error);
                setLoaded(true);
            }
        );
    }, [user.role, master, outletKey, max]);

    useEffect(() => {
        fetchAppCustomers().then((result) => setCustomers(result.data));
    }, []);

    const customerByPhone = useMemo(
        () => new Map(customers.map((customer) => [customer.phone, customer])),
        [customers]
    );

    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();
        return notifications.filter((item) => {
            if (typeFilter !== "all" && item.type !== typeFilter) return false;
            if (!query) return true;
            const name = customerByPhone.get(item.target)?.name.toLowerCase() ?? "";
            return (
                item.title.toLowerCase().includes(query) ||
                item.body.toLowerCase().includes(query) ||
                item.orderId.toLowerCase().includes(query) ||
                name.includes(query) ||
                (item.target !== BROADCAST_TARGET && phoneMatches(item.target, query))
            );
        });
    }, [notifications, typeFilter, search, customerByPhone]);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        setActionError("");
        const result = await deleteAppNotification(id);
        setDeletingId(null);
        setConfirmDeleteId(null);
        if (!result.success) setActionError(result.message);
    };

    const closeForm = useCallback(() => setFormOpen(false), []);

    return (
        <div className="min-h-[calc(100dvh-40px)] space-y-6">
            <div className="space-y-1 pr-24">
                <Label className="text-3xl font-bold w-fit">Notifikasi App</Label>
                <p className="text-sm text-gray-600">
                    Notifikasi yang tampil di halaman Notifikasi app customer
                    {master ? "" : ` untuk outlet ${outlets.map((outlet) => outlet.name).join(", ")}`}.
                    Termasuk notifikasi otomatis saat status pesanan diubah.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-80">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input 
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Cari judul, isi, pelanggan, atau no. pesanan"
                        aria-label="Cari notifikasi"
                        className="pl-9"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setFormOpen(true)}
                    className="cursor-pointer ml-auto bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-1.5 rounded-md"
                >
                    + Kirim Notifikasi
                </button>
            </div>

            <div role="tablist" aria-label="Filter tipe" className="flex gap-2 overflow-x-auto pb-1">
                {TYPE_TABS.filter((tab) => canBroadcast || tab.value !== "broadcast").map((tab) => {
                    const selected = typeFilter === tab.value;
                    return (
                        <button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => setTypeFilter(tab.value)}
                            className={cn(
                                "shrink-0 rounded-full border px-3 py-1 text-sm cursor-pointer",
                                selected
                                    ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
                                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {listError && <SubscriptionErrorAlert error={listError} />}
            {actionError && (
                <p role="alert" className="text-sm text-red-600">
                    {actionError}
                </p>
            )}

            {loaded && !listError && (
                <div className="rounded-md border w-full bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Notifikasi</TableHead>
                                <TableHead className="hidden md:table-cell">Penerima</TableHead>
                                <TableHead className="hidden lg:table-cell">Pengirim</TableHead>
                                <TableHead className="w-28 text-right" aria-label="Aksi" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((item) => {
                                const isBroadcast = item.target === BROADCAST_TARGET;
                                const customer = customerByPhone.get(item.target);
                                const outletName = findAppOutlet(item.outletId)?.name;
                                const confirming = confirmDeleteId === item.id;
                                const recipient = isBroadcast ? (
                                    <span className="text-gray-900">Semua pelanggan</span>
                                ) : (
                                    <Link
                                        href={`/app-customers/${phoneToRouteId(item.target)}`}
                                        className="text-gray-900 hover:underline"
                                    >
                                        {customer?.name || formatPhoneDisplay(item.target)}
                                    </Link>
                                );
                                return (
                                    <TableRow key={item.id} className="align-top">
                                        <TableCell className="whitespace-normal">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className={cn(
                                                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                                                        APP_NOTIFICATION_TYPE[item.type].className
                                                    )}
                                                >
                                                    {APP_NOTIFICATION_TYPE[item.type].label}
                                                </span>
                                                <span className="text-xs text-gray-500">{formatDateTime(item.createdAt)}</span>
                                            </div>
                                            <p className="mt-1 font-medium text-gray-900 break-words">{item.title}</p>
                                            <p className="text-sm text-gray-600 whitespace-pre-line break-words max-w-xl">
                                                {item.body}
                                            </p>
                                            {(item.orderId || outletName) && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {item.orderId && `Pesanan ${item.orderId}`}
                                                    {item.orderId && outletName && " · "}
                                                    {outletName && `Outlet ${outletName}`}
                                                </p>
                                            )}
                                            <p className="md:hidden mt-1 text-xs text-gray-600">Ke: {recipient}</p>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {recipient}
                                            {!isBroadcast && customer && (
                                                <p className="text-xs text-gray-500">{formatPhoneDisplay(item.target)}</p>
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-sm text-gray-600">
                                            {item.createdBy === SYSTEM_SENDER ? "Otomatis" : item.createdBy || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {confirming ? (
                                                <div className="flex flex-col items-end gap-1 text-xs">
                                                    <span className="text-gray-600">Hapus dari app?</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(item.id)}
                                                            disabled={deletingId === item.id}
                                                            className="font-semibold text-red-600 hover:underline cursor-pointer disabled:opacity-50"
                                                        >
                                                            {deletingId === item.id ? "Menghapus..." : "Ya, hapus"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmDeleteId(null)}
                                                            disabled={deletingId === item.id}
                                                            className="text-gray-600 hover:underline cursor-pointer"
                                                        >
                                                            Batal
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setActionError("");
                                                        setConfirmDeleteId(item.id);
                                                    }}
                                                    aria-label={`Hapus notifikasi ${item.title}`}
                                                    className="rounded p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {visible.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                                        {search.trim() || typeFilter !== "all"
                                            ? "Tidak ada notifikasi yang cocok."
                                            : "Belum ada notifikasi."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {hasMore && !listError && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => setMax((current) => current + APP_NOTIFICATION_PAGE_SIZE)}
                        className="cursor-pointer rounded-md border border-gray-300 px-5 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Muat notifikasi lebih lama
                    </button>
                </div>
            )}

            {formOpen && (
                <AppNotificationForm 
                    customers={customers}
                    outlets={outlets}
                    isMaster={master}
                    actorEmail={user.email}
                    onClose={closeForm}
                    onSent={closeForm}
                />
            )}
            {!loaded && <Loading />}
        </div>
    );
};

export default AppNotificationsPage;