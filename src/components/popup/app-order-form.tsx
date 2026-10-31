"use client";
import React, { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Bell, Info, Minus, Plus, X } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import AppCustomerPicker from "../app-customer-picker";
import AppServiceIcon from "../app-service-icon";
import {
    APP_ORDER_NOTE_MAX,
    APP_ORDER_STATUS,
    APP_ORDER_STATUSES,
    APP_ORDER_UNIT_RULES,
} from "@/constants/app-orders";
import { AppOutlet, findAppOutlet } from "@/constants/app-outlets";
import { orderNotificationText } from "@/constants/app-notifications";
import {
    calcDeliveryFee,
    calcSubtotal,
    createAppOrder,
    roundQuantity,
    updateAppOrder,
} from "@/lib/app-orders";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { AppCustomer } from "@/types/app-customer";
import { AppOrder, AppOrderItem, AppOrderMethod, AppOrderStatus } from "@/types/app-order";
import { AppService, AppServiceUnit } from "@/types/app-service";

interface AppOrderFormProps {
    order: AppOrder | null;
    customer: AppCustomer | null;
    customers: AppCustomer[];
    services: AppService[];
    outlets: AppOutlet[];
    actorEmail: string;
    registeredPhone?: string;
    onRegisterCustomer?: () => void;
    onClose: () => void;
    onSaved: (saved: { phone: string; id: string }) => void;
}

type Line = AppOrderItem & { quantityText: string };

const segmentClass =
    "px-4 cursor-pointer data-[state=on]:bg-[var(--primary-color)] data-[state=on]:text-white";

const textareaClass =
    "placeholder:text-muted-foreground border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none resize-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[0.5px] disabled:cursor-not-allowed disabled:opacity-50";

const unitRule = (unit: string) => APP_ORDER_UNIT_RULES[unit as AppServiceUnit];

const parseQuantity = (text: string) => (text.trim() ? Number(text.replace(",", ".")) : NaN);

const formatQuantityInput = (quantity: number) =>
    String(quantity).replace(".", ",");

const toLine = (item: AppOrderItem): Line => ({
    ...item,
    quantityText: formatQuantityInput(item.quantity),
});

function AppOrderForm({
    order,
    customer,
    customers,
    services,
    outlets,
    actorEmail,
    registeredPhone,
    onRegisterCustomer,
    onClose,
    onSaved,
}: AppOrderFormProps) {
    const isEdit = !!order;
    const outletIds = outlets.map((outlet) => outlet.id);

    const [phone, setPhone] = useState(customer?.phone ?? order?.customerPhone ?? "");
    const [outletId, setOutletId] = useState(() => {
        if (order && outletIds.includes(order.outletId)) return order.outletId;
        return outlets.length === 1 ? outlets[0].id : "";
    });
    const [method, setMethod] = useState<AppOrderMethod>(order?.method ?? "pickup");
    const [pickupAddress, setPickupAddress] = useState(
        order?.pickupAddress || customer?.address || ""
    );
    const [addressTouched, setAddressTouched] = useState(isEdit);
    const [lines, setLines] = useState<Line[]>(() => (order?.items ?? []).map(toLine));
    const [feeManual, setFeeManual] = useState(
        () => !!order && order.deliveryFee !== calcDeliveryFee(order.method, order.subtotal)
    );
    const [feeText, setFeeText] = useState(order ? String(order.deliveryFee) : "");
    const [note, setNote] = useState(order?.note ?? "");
    const [status, setStatus] = useState<AppOrderStatus>(order?.status ?? "processing");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const selectedCustomer =
        customer ?? customers.find((item) => item.phone === phone) ?? null;

    useEffect(() => {
        if (registeredPhone) setPhone(registeredPhone);
    }, [registeredPhone]);

    useEffect(() => {
        if (!addressTouched) setPickupAddress(selectedCustomer?.address ?? "");
    }, [selectedCustomer?.address, addressTouched]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !saving) onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [saving, onClose]);

    const items: AppOrderItem[] = lines.map(({ quantityText, ...item }) => ({
        ...item,
        quantity: parseQuantity(quantityText),
    }));
    const subtotal = calcSubtotal(
        items.map((item) => ({ ...item, quantity: Number.isFinite(item.quantity) ? item.quantity : 0 }))
    );
    const autoFee = calcDeliveryFee(method, subtotal);
    const deliveryFee = method !== "pickup" ? 0 : feeManual ? Number(feeText || 0) : autoFee;
    const total = subtotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0);

    const notificationPreview =
        !isEdit || status !== order.status
            ? orderNotificationText(isEdit ? status : "created", {
                id: order?.id ?? "",
                outletName: findAppOutlet(outletId)?.name ?? "",
                method,
            })
            : null;

    const addableServices = useMemo(
        () =>
            services.filter(
                (service) => service.active && !lines.some((line) => line.serviceId === service.id)
            ),
        [services, lines]
    );

    const touch = () => setError("");

    const addService = (serviceId: string) => {
        const service = services.find((item) => item.id === serviceId);
        if (!service) return;
        touch();
        setLines((current) => [
            ...current,
            toLine({
                id: service.id,
                serviceId: service.id,
                serviceName: service.name,
                itemName: service.name,
                price: service.price,
                unit: service.unit,
                quantity: 1,
            }),
        ]);
    };

    const updateLine = (index: number, quantityText: string) => {
        touch();
        setLines((current) =>
            current.map((line, i) => (i === index ? { ...line, quantityText } : line))
        );
    };

    const stepLine = (index: number, direction: -1 | 1) => {
        const line = lines[index];
        const rule = unitRule(line.unit) ?? { step: 1, min: 1, max: 999, decimals: 0 };
        const current = parseQuantity(line.quantityText);
        const base = Number.isFinite(current) ? current : 0;
        const next = Math.min(rule.max, Math.max(rule.min, roundQuantity(base + direction * rule.step, line.unit)));
        updateLine(index, formatQuantityInput(next));
    };

    const removeLine = (index: number) => {
        touch();
        setLines((current) => current.filter((_, i) => i !== index));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (saving) return;
        if (!phone) return setError("Pilih customer.");
        const badLine = items.find((item) => !Number.isFinite(item.quantity));
        if (badLine) return setError(`Jumlah ${badLine.itemName} belum diisi dengan benar.`);
        if (method === "pickup" && feeManual && !/^\d+$/.test(feeText.trim())) {
            return setError("Biaya antar jemput harus angka, tanpa titik.");
        }

        setSaving(true);
        setError("");
        const input = { outletId, method, pickupAddress, note, status, items, deliveryFee };
        const result =
            isEdit && order
                ? await updateAppOrder(order.customerPhone, order.id, input, order.status, outletIds, actorEmail)
                : await createAppOrder(phone, input, outletIds, actorEmail);
        setSaving(false);

        if (!result.success) return setError(result.message);
        const id = isEdit && order ? order.id : (result.data as { id: string }).id;
        onSaved({ phone, id });
    };

    return (
        <div
            className="fixed w-screen h-[100dvh] top-0 left-0 bg-black/50 flex justify-center items-center z-10 px-4"
            onClick={() => !saving && onClose()}
        >
            <form
                noValidate
                onSubmit={handleSubmit}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="app-order-form-title"
                className="w-full sm:w-[600px] bg-white rounded-md p-6 sm:p-7 max-h-[92dvh] overflow-y-auto"
            >
                <div className="mb-5">
                    <Label id="app-order-form-title" className="text-xl font-semibold block">
                        {isEdit ? `Pesanan ${order.id}` : "Buat Pesanan"}
                    </Label>
                    {isEdit && (
                        <p className="text-xs text-gray-500">Dibuat {formatDateTime(order.createdAt)}</p>
                    )}
                </div>

                {isEdit && (
                    <p className="mb-5 flex gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        <Info className="size-4 shrink-0" />
                        Perubahan langsung terlihat di Riwayat app customer.
                    </p>
                )}

                <div className="grid w-full gap-1.5 mb-5">
                    <Label htmlFor="order-customer">Customer</Label>
                    {customer || isEdit ? (
                        <p id="order-customer" className="text-sm font-medium text-gray-900">
                            {selectedCustomer?.name || "(customer tidak ditemukan)"}
                            <span className="font-normal text-gray-500"> · {formatPhoneDisplay(phone)}</span>
                        </p>
                    ) : (
                        <>
                            <AppCustomerPicker
                                id="order-customer"
                                customers={customers}
                                value={phone}
                                onChange={(value) => {
                                    touch();
                                    setPhone(value);
                                }}
                                disabled={saving}
                            />
                            {onRegisterCustomer && (
                                <button
                                    type="button"
                                    onClick={onRegisterCustomer}
                                    disabled={saving}
                                    className="w-fit text-xs font-medium text-[var(--primary-color)] hover:underline cursor-pointer"
                                >
                                    + Customer belum terdaftar? Daftarkan dulu
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2 mb-5">
                    <div className="grid gap-1.5">
                        <Label htmlFor="order-outlet">Outlet</Label>
                        {outlets.length === 1 ? (
                            <p id="order-outlet" className="text-sm text-gray-900 h-9 flex items-center">
                                {outlets[0].name}
                            </p>
                        ) : (
                            <Select
                                value={outletId}
                                onValueChange={(value) => {
                                    touch();
                                    setOutletId(value);
                                }}
                                disabled={saving}
                            >
                                <SelectTrigger id="order-outlet" className="w-full">
                                    <SelectValue placeholder="Pilih outlet" />
                                </SelectTrigger>
                                <SelectContent>
                                    {outlets.map((outlet) => (
                                        <SelectItem key={outlet.id} value={outlet.id}>
                                            {outlet.name} ({outlet.city})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="grid gap-1.5">
                        <Label>Metode</Label>
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            value={method}
                            onValueChange={(value) => {
                                if (!value) return;
                                touch();
                                setMethod(value as AppOrderMethod);
                            }}
                            aria-label="Metode"
                            className="h-9 w-full"
                            disabled={saving}
                        >
                            <ToggleGroupItem value="pickup" className={cn(segmentClass, "h-9")}>
                                Antar jemput
                            </ToggleGroupItem>
                            <ToggleGroupItem value="dropoff" className={cn(segmentClass, "h-9")}>
                                Antar sendiri
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>

                {method === "pickup" && (
                    <div className="grid w-full gap-1.5 mb-5">
                        <Label htmlFor="order-address">Alamat jemput</Label>
                        <textarea
                            id="order-address"
                            rows={2}
                            value={pickupAddress}
                            onChange={(event) => {
                                touch();
                                setAddressTouched(true);
                                setPickupAddress(event.target.value);
                            }}
                            placeholder="Alamat penjemputan"
                            disabled={saving}
                            className={textareaClass}
                        />
                    </div>
                )}

                <div className="grid w-full gap-2 mb-5">
                    <Label>Item</Label>
                    {lines.length === 0 && (
                        <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-gray-500">
                            Belum ada item. Pilih layanan di bawah.
                        </p>
                    )}
                    <ul className="divide-y rounded-md border empty:hidden">
                        {lines.map((line, index) => {
                            const quantity = parseQuantity(line.quantityText);
                            const lineTotal = Number.isFinite(quantity) ? Math.round(line.price * quantity) : 0;
                            const service = services.find((item) => item.id === line.serviceId);
                            return (
                                <li
                                    key={line.id}
                                    className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 p-3 sm:flex"
                                >
                                    <div className="flex min-w-0 items-center gap-2 sm:flex-1">
                                        <AppServiceIcon name={service?.icon ?? ""} className="size-8" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900">{line.itemName}</p>
                                            <p className="text-xs text-gray-500">
                                                {formatRupiah(line.price)} / {line.unit}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeLine(index)}
                                        disabled={saving}
                                        aria-label={`Hapus ${line.itemName}`}
                                        className="rounded p-1 text-gray-400 hover:text-red-600 cursor-pointer disabled:opacity-50 sm:order-last"
                                    >
                                        <X className="size-4" />
                                    </button>
                                    <div className="col-span-2 flex items-center justify-between gap-3 sm:justify-end">
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => stepLine(index, -1)}
                                                disabled={saving}
                                                aria-label={`Kurangi ${line.itemName}`}
                                                className="rounded-md border p-1.5 text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                                            >
                                                <Minus className="size-3.5" />
                                            </button>
                                            <Input
                                                value={line.quantityText}
                                                onChange={(event) =>
                                                    updateLine(index, event.target.value.replace(/[^\d.,]/g, ""))
                                                }
                                                inputMode="decimal"
                                                aria-label={`Jumlah ${line.itemName} (${line.unit})`}
                                                className="h-8 w-16 text-center"
                                                disabled={saving}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => stepLine(index, 1)}
                                                disabled={saving}
                                                aria-label={`Tambah ${line.itemName}`}
                                                className="rounded-md border p-1.5 text-gray-600 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                                            >
                                                <Plus className="size-3.5" />
                                            </button>
                                            <span className="w-7 text-xs text-gray-500">{line.unit}</span>
                                        </div>
                                        <span className="w-24 text-right text-sm text-gray-900">
                                            {formatRupiah(lineTotal)}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {services.length === 0 ? (
                        <p className="text-xs text-red-600">
                            Katalog layanan masih kosong. Minta akun Master mengisinya di App Customer → Layanan.
                        </p>
                    ) : addableServices.length > 0 ? (
                        <Select value="" onValueChange={addService} disabled={saving}>
                            <SelectTrigger className="w-full sm:w-72" aria-label="Tambah item dari katalog">
                                <SelectValue placeholder="+ Tambah item dari katalog" />
                            </SelectTrigger>
                            <SelectContent>
                                {addableServices.map((service) => (
                                    <SelectItem key={service.id} value={service.id}>
                                        {service.name} · {formatRupiah(service.price)}/{service.unit}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <p className="text-xs text-gray-500">Semua layanan aktif sudah ada di pesanan ini.</p>
                    )}
                    <span className="text-xs text-gray-500">
                        Isi berat asli hasil timbang, mis. 3,2 kg. Harga item lama tetap memakai harga saat
                        dipesan.
                    </span>
                </div>

                <dl className="mb-5 space-y-1.5 rounded-md bg-gray-50 px-4 py-3 text-sm">
                    <div className="flex justify-between gap-3 text-gray-700">
                        <dt>Subtotal</dt>
                        <dd>{formatRupiah(subtotal)}</dd>
                    </div>
                    {method === "pickup" && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-gray-700">
                            <dt className="flex items-center gap-2">
                                Antar jemput
                                <button
                                    type="button"
                                    onClick={() => {
                                        touch();
                                        if (!feeManual) setFeeText(String(autoFee));
                                        setFeeManual(!feeManual);
                                    }}
                                    disabled={saving}
                                    className="text-xs font-medium text-[var(--primary-color)] hover:underline cursor-pointer"
                                >
                                    {feeManual ? "Pakai otomatis" : "Ubah"}
                                </button>
                            </dt>
                            <dd>
                                {feeManual ? (
                                    <Input
                                        value={feeText}
                                        onChange={(event) => {
                                            touch();
                                            setFeeText(event.target.value.replace(/\D/g, ""));
                                        }}
                                        inputMode="numeric"
                                        aria-label="Biaya antar jemput"
                                        className="h-8 w-28 bg-white text-right"
                                        disabled={saving}
                                    />
                                ) : autoFee === 0 ? (
                                    "Gratis"
                                ) : (
                                    formatRupiah(autoFee)
                                )}
                            </dd>
                        </div>
                    )}
                    <div className="flex justify-between gap-3 border-t pt-1.5 font-semibold text-gray-900">
                        <dt>Total</dt>
                        <dd>{formatRupiah(total)}</dd>
                    </div>
                </dl>

                {/* Catatan & status */}
                <div className="grid gap-5 sm:grid-cols-[1fr_200px] mb-5">
                    <div className="grid gap-1.5">
                        <Label htmlFor="order-note">Catatan (opsional)</Label>
                        <Input
                            id="order-note"
                            value={note}
                            maxLength={APP_ORDER_NOTE_MAX}
                            onChange={(event) => {
                                touch();
                                setNote(event.target.value);
                            }}
                            placeholder="Contoh: jangan pakai pewangi"
                            disabled={saving}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="order-status">Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value) => {
                                touch();
                                setStatus(value as AppOrderStatus);
                            }}
                            disabled={saving}
                        >
                            <SelectTrigger id="order-status" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {APP_ORDER_STATUSES.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {APP_ORDER_STATUS[value].label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {(status === "pending" || notificationPreview) && (
                    <div className="-mt-3 mb-5 space-y-1 text-xs text-gray-500">
                        {status === "pending" && (
                            <p>Selama status Menunggu, customer masih bisa membatalkan pesanan dari app.</p>
                        )}
                        {notificationPreview && (
                            <p className="flex items-center gap-1.5 text-[var(--primary-color)]">
                                <Bell className="size-3.5 shrink-0" />
                                Customer akan menerima notifikasi &ldquo;{notificationPreview.title}&rdquo;.
                            </p>
                        )}
                    </div>
                )}

                {error && (
                    <p role="alert" className="mb-3 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 rounded-md border border-gray-300 py-1.5 text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-[2] bg-[var(--primary-color)] text-white rounded-md py-1.5 cursor-pointer flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <BadgeCheck className="size-4" />
                        {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Pesanan"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AppOrderForm;