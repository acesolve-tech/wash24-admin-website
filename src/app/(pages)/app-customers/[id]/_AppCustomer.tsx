"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageCircle, Pen } from "lucide-react";
import { Label } from "@/components/ui/label";
import Loading from "@/components/Loading";
import AppOrderCard from "@/components/app-order-card";
import AppCustomerTierBadge from "@/components/app-customer-tier-badge";
import AppCustomerForm from "@/components/popup/app-customer-form";
import AppOrderForm from "@/components/popup/app-order-form";
import { canEditAppCustomer, getAppOutlets, isMaster } from "@/config/access";
import { fetchAppCustomer } from "@/lib/app-customers";
import { fetchCustomerOrders } from "@/lib/app-orders";
import { fetchAppServices } from "@/lib/app-services";
import { formatDate } from "@/lib/format";
import { formatPhoneDisplay, routeIdToPhone, whatsappUrl } from "@/lib/phone";
import { userStore } from "@/store/user";
import { AppCustomer } from "@/types/app-customer";
import { AppOrder } from "@/types/app-order";
import { AppService } from "@/types/app-service";

const AppCustomerPage = () => {
    const params = useParams();
    const rawId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
    const phone = routeIdToPhone(rawId);

    const user = userStore((state: any) => state.user);
    const canEdit = canEditAppCustomer(user);

    const outletIds = useMemo(
        () => (isMaster(user) ? null : getAppOutlets(user).map((outlet) => outlet.id)),
        [user]
    );
    const outlets = useMemo(() => getAppOutlets(user), [user]);

    const [customer, setCustomer] = useState<AppCustomer | null>(null);
    const [orders, setOrders] = useState<AppOrder[]>([]);
    const [hiddenCount, setHiddenCount] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [ordersError, setOrdersError] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [services, setServices] = useState<AppService[]>([]);
    const [orderForm, setOrderForm] = useState<{ open: false } | { open: true; order: AppOrder | null }>({
        open: false,
    });

    const load = useCallback(async () => {
        if (!phone || !user.role) return;
        setLoading(true);
        const [customerResult, ordersResult] = await Promise.all([
            fetchAppCustomer(phone),
            fetchCustomerOrders(phone, outletIds),
        ]);
        setLoading(false);
        setLoaded(true);

        setError(customerResult.success ? "" : customerResult.message);
        setCustomer(customerResult.data);
        setOrdersError(ordersResult.success ? "" : ordersResult.message);
        setOrders(ordersResult.data.orders);
        setHiddenCount(ordersResult.data.hiddenCount);
    }, [phone, user.role, outletIds]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        fetchAppServices().then((result) => setServices(result.data));
    }, []);

    const closeForm = useCallback(() => setFormOpen(false), []);
    const closeOrderForm = useCallback(() => setOrderForm({ open: false }), []);

    const backLink = (
        <Link
            href="/app-customers"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
            <ArrowLeft className="size-4" />
            Semua customer
        </Link>
    );

    if (!phone || (loaded && !error && !customer)) {
        return (
            <div className="min-h-[calc(100dvh-40px)] space-y-6">
                {backLink}
                <div className="rounded-md border bg-white px-6 py-10 text-center">
                    <p className="font-semibold text-gray-800">Customer tidak ditemukan</p>
                    <p className="mt-1 text-sm text-gray-600">
                        Nomor ini belum terdaftar, atau linknya salah.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100dvh-40px)] space-y-6">
            {backLink}

            {error && (
                <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <span>{error}</span>
                    <button type="button" onClick={load} className="font-semibold cursor-pointer hover:underline">
                        Muat ulang
                    </button>
                </div>
            )}

            {customer && (
                <>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                            <Label className="text-3xl font-bold w-fit break-words">
                                {customer.name || "(tanpa nama)"}
                            </Label>
                            <p className="text-sm text-gray-600">{formatPhoneDisplay(customer.phone)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a 
                                href={whatsappUrl(customer.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <MessageCircle className="size-4" />
                                Chat WhatsApp
                            </a>
                            {canEdit && (
                                <button
                                    type="button"
                                    onClick={() => setFormOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-md bg-[var(--primary-color)] px-4 py-1.5 text-sm text-white hover:bg-[#301094] cursor-pointer"
                                >
                                    <Pen className="size-4" />
                                    Ubah Data
                                </button>
                            )}
                        </div>
                    </div>

                    <section aria-label="Data customer" className="rounded-md border bg-white p-5">
                        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                            <div className="sm: col-span-2">
                                <dt className="text-xs text-gray-500">Alamat</dt>
                                <dd className="text-gray-900 whitespace-pre-line">{customer.address || "-"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Tanggal lahir</dt>
                                <dd className="text-gray-900">{formatDate(customer.birthDate)}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Tier & poin</dt>
                                <dd>
                                    <AppCustomerTierBadge customer={customer} />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Terdaftar</dt>
                                <dd className="text-gray-900">
                                    {formatDate(customer.createdAt)}
                                    <span className="text-gray-500">
                                        {customer.source === "admin"
                                            ? ` · didaftarkan admin${customer.createdBy ? ` (${customer.createdBy})` : ""}`
                                            : " · lewat app"}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Terakhir diubah</dt>
                                <dd className="text-gray-900">{formatDate(customer.updatedAt)}</dd>
                            </div>
                        </dl>
                    </section>

                    <section aria-labelledby="orders-title" className="space-y-3">
                        <div className="flex flex-wrap items-end justify-between gap-2">
                            <div>
                                <h2 id="orders-title" className="text-lg font-semibold text-gray-900">
                                    Riwayat Pesanan{orders.length > 0 && ` (${orders.length})`}
                                </h2>
                                {hiddenCount > 0 && (
                                    <p className="text-xs text-gray-500">
                                        {hiddenCount} pesanan di outlet lain tidak ditampilkan.
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setOrderForm({ open: true, order: null })}
                                className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded-md text-sm"
                            >
                                + Buat Pesanan
                            </button>
                        </div>

                        {ordersError ? (
                            <p role="alert" className="text-sm text-red-600">
                                {ordersError}
                            </p>
                        ) : orders.length === 0 ? (
                            <div className="rounded-md border bg-white px-6 py-8 text-center text-sm text-gray-500">
                                Belum ada pesanan{hiddenCount > 0 ? " di outlet Anda" : ""}.
                            </div>
                        ) : (
                            <div className="grid gap-3 lg:grid-cols-2 items-start">
                                {orders.map((order) => (
                                    <AppOrderCard 
                                        key={order.id}
                                        order={order}
                                        onEdit={() => setOrderForm({ open: true, order })}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {formOpen && customer && (
                <AppCustomerForm 
                    customer={customer}
                    actorEmail={user.email}
                    onClose={closeForm}
                    onSaved={() => {
                        setFormOpen(false);
                        load();
                    }}
                />
            )}
            {orderForm.open && customer && (
                <AppOrderForm 
                    order={orderForm.order}
                    customer={customer}
                    customers={[customer]}
                    services={services}
                    outlets={outlets}
                    actorEmail={user.email}
                    onClose={closeOrderForm}
                    onSaved={() => {
                        setOrderForm({ open: false });
                        load();
                    }}
                />
            )}
            {(loading || (!loaded && !error)) && <Loading />}
        </div>
    );
};

export default AppCustomerPage;