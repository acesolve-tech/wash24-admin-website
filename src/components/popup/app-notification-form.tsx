"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Bell, Info, Send } from "lucide-react";
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
import { APP_NOTIFICATION_LIMITS, BROADCAST_TARGET } from "@/constants/app-notifications";
import { APP_ORDER_STATUS } from "@/constants/app-orders";
import { AppOutlet } from "@/constants/app-outlets";
import { sendAppNotification } from "@/lib/app-notifications";
import { fetchCustomerOrders } from "@/lib/app-orders";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppCustomer } from "@/types/app-customer";
import { AppOrder } from "@/types/app-order";

type Mode = "personal" | "broadcast";

const NO_ORDER = "__none__";

interface AppNotificationFormProps {
    customers: AppCustomer[];
    outlets: AppOutlet[];
    isMaster: boolean;
    actorEmail: string;
    onClose: () => void;
    onSent: () => void;
}

const segmentClass =
    "px-4 cursor-pointer data-[state=on]:bg-[var(--primary-color)] data-[state=on]:text-white";

const textareaClass =
    "placeholder:text-muted-foreground border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none resize-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[0.5px] disabled:cursor-not-allowed disabled:opacity-50";

function AppNotificationForm({
    customers,
    outlets,
    isMaster,
    actorEmail,
    onClose,
    onSent,
}: AppNotificationFormProps) {
    const outletIds = useMemo(() => outlets.map((outlet) => outlet.id), [outlets]);

    const [mode, setMode] = useState<Mode>("personal");
    const [phone, setPhone] = useState("");
    const [orders, setOrders] = useState<AppOrder[]>([]);
    const [ordersState, setOrdersState] = useState<"idle" | "loading" | "ready" | "error">("idle");
    const [orderId, setOrderId] = useState(NO_ORDER);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [confirmBroadcast, setConfirmBroadcast] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const isBroadcast = mode === "broadcast";

    useEffect(() => {
        setOrderId(NO_ORDER);
        setOrders([]);
        if (!phone) {
            setOrdersState("idle");
            return;
        }
        let cancelled = false;
        setOrdersState("loading");
        fetchCustomerOrders(phone, isMaster ? null : outletIds).then((result) => {
            if (cancelled) return;
            setOrders(result.data.orders);
            setOrdersState(result.success ? "ready" : "error");
        });
        return () => {
            cancelled = true;
        };
    }, [phone, isMaster, outletIds]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !saving) onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [saving, onClose]);

    const selectedOrder = orders.find((order) => order.id === orderId) ?? null;
    const notEligible = !isMaster && ordersState === "ready" && orders.length === 0;

    const outletId = 
        selectedOrder?.outletId ??
        (isMaster ? "" : outlets.length === 1 ? outlets[0].id : orders[0]?.outletId ?? "");

    const touch = () => {
        setError("");
        setConfirmBroadcast(false);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (saving) return;
        if (!isBroadcast && ordersState === "loading") return setError("Tunggu sebentar, data pelanggan sedang dimuat.");
        if (notEligible) return setError("Pelanggan ini belum pernah pesan di outlet Anda.");

        if (isBroadcast && !confirmBroadcast) {
            if (!title.trim() || !body.trim()) {
                return setError(!title.trim() ? "Judul wajib diisi." : "Isi pesan wajib diisi.");
            }
            return setConfirmBroadcast(true);
        }

        setSaving(true);
        setError("");
        const result = await sendAppNotification(
            {
                title,
                body,
                target: isBroadcast ? BROADCAST_TARGET : phone,
                orderId: selectedOrder?.id ?? "",
                outletId,
            },
            { canBroadcast: isMaster, requireOutlet: !isMaster, actorEmail }
        );
        setSaving(false);
        if (!result.success) {
            setConfirmBroadcast(false);
            return setError(result.message);
        }
        onSent();
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
                aria-labelledby="app-notification-form-title"
                className="2-full sm:w-[520px] bg-white rounded-md p-6 sm:p-7 max-h-[92dvh] overflow-y-auto"
            >
                <Label id="app-notification-form-title" className="text-xl font-semibold mb-5 block">
                    Kirim Notifikasi
                </Label>

                <div className="grid w-full gap-1.5 mb-5">
                    <Label>Penerima</Label>
                    {isMaster ? (
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            value={mode}
                            onValueChange={(value) => {
                                if (!value) return;
                                touch();
                                setMode(value as Mode);
                            }}
                            aria-label="Penerima"
                            className="h-9 w-full"
                            disabled={saving}
                        >
                            <ToggleGroupItem value="personal" className={cn(segmentClass, "h-9")}>
                                Satu pelanggan
                            </ToggleGroupItem>
                            <ToggleGroupItem value="broadcast" className={cn(segmentClass, "h-9")}>
                                Semua pelanggan
                            </ToggleGroupItem>
                        </ToggleGroup>
                    ) : (   
                        <p className="flex gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                            <Info className="size-4 shrink-0" />
                            Admin outlet hanya bisa mengirim ke pelanggan yang pernah pesan di outlet{" "}
                            {outlets.map((outlet) => outlet.name).join(", ")}.
                        </p>
                    )}
                </div>

                {isBroadcast ? (
                    <p className="mb-5 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Dikirim ke <strong>semua pelanggan</strong> yang sudah terdaftar. Pelanggan yang mendaftar setelah ini tidak akan melihatnya.
                    </p>
                ) : (
                    <>
                        <div className="grid w-full gap-1.5 mb-5">
                            <Label htmlFor="notification-customer">Pelanggan</Label>
                            <AppCustomerPicker 
                                id="notification-customer"
                                customers={customers}
                                value={phone}
                                onChange={(value) => {
                                    touch();
                                    setPhone(value);
                                }}
                                disabled={saving}
                            />
                            {ordersState === "loading" && (
                                <span className="text-xs text-gray-500">Memeriksa pesanan pelanggan...</span>
                            )}
                            {ordersState === "error" && (
                                <span className="text-xs text-red-600">Pesanan pelanggan gagal dimuat.</span>
                            )}
                            {notEligible && (
                                <span className="text-xs text-red-600">
                                    Pelanggan ini belum pernah pesan di outlet Anda, jadi tidak bisa dikirimi notifikasi dari akun ini.
                                </span>
                            )}
                        </div>

                        {phone && orders.length > 0 && (
                            <div className="grid w-full gap-1.5 mb-5">
                                <Label htmlFor="notification-order">Terkait pesanan (opsional)</Label>
                                <Select
                                    value={orderId}
                                    onValueChange={(value) => {
                                        touch();
                                        setOrderId(value);
                                    }}
                                    disabled={saving}
                                >
                                    <SelectTrigger id="notification-order" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NO_ORDER}>Tidak terkait pesanan</SelectItem>
                                        {orders.map((order) => (
                                            <SelectItem key={order.id} value={order.id}>
                                                {order.id} · {APP_ORDER_STATUS[order.status].label} ·{" "}
                                                {formatDate(order.createdAt)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <span className="text-xs text-gray-500">
                                    Kalau diisi, pelanggan yang mengetuk notifikasi langsung dibawa ke detail pesanan itu.
                                </span>
                            </div>
                        )}
                    </>
                )}

                <div className="grid w-full gap-1.5 mb-5">
                    <div className="flex justify-between items-end">
                        <Label htmlFor="notification-title">Judul</Label>
                        <span className="text-xs text-gray-400">
                            {title.length}/{APP_NOTIFICATION_LIMITS.titleMax}
                        </span>
                    </div>
                    <Input 
                        id="notification-title"
                        value={title}
                        maxLength={APP_NOTIFICATION_LIMITS.titleMax}
                        onChange={(event) => {
                            touch();
                            setTitle(event.target.value);
                        }}
                        placeholder="Contoh: Promo cuci setrika minggu ini"
                        disabled={saving}
                    />
                </div>

                <div className="grid w-full gap-1.5 mb-5">
                    <div className="flex justify-between items-end">
                        <Label htmlFor="notification-body">Isi pesan</Label>
                        <span className="text-xs text-gray-400">
                            {body.length}/{APP_NOTIFICATION_LIMITS.bodyMax}
                        </span>
                    </div>
                    <textarea 
                        id="notification-body"
                        rows={4}
                        value={body}
                        maxLength={APP_NOTIFICATION_LIMITS.bodyMax}
                        onChange={(event) => {
                            touch();
                            setBody(event.target.value);
                        }}
                        placeholder="Tulis oesan untuk pelanggan"
                        disabled={saving}
                        className={textareaClass}
                    />
                </div>

                <div className="mb-5">
                    <p className="mb-1.5 text-xs text-gray-500">Pratinjau di app</p>
                    <div className="flex gap-3 rounded-md border bg-gray-50 p-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#303094]/10 text-[var(--primary-color)]">
                            <Bell className="size-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 break-words">
                                {title.trim() || "Judul notifikasi"}
                            </p>
                            <p className="text-xs text-gray-600 whitespace-pre-line break-words">
                                {body.trim() || "Isi pesan akan tampil di sini."}
                            </p>
                            <p className="mt-1 text-[11px] text-gray-400">Baru saja</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <p role="alert" className="mb-3 text-sm text-red-600">
                        {error}
                    </p>
                )}

                {confirmBroadcast ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-3">
                        <p className="text-sm text-amber-900">
                            Kirim notifikasi ini ke <strong>semua pelanggan</strong>
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmBroadcast(false)}
                                disabled={saving}
                                className="flex-[2] bg-[var(--primary-color)] text-white rounded-md py-1.5 cursor-pointer flex justify-center items-center gap-2 disabled:opacity-60"
                            >
                                <Send className="size-4" />
                                {saving ? "Mengirim..." : "Ya, kirim ke semua"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1/2 rounded-md border border-gray-300 py-1.5 text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving || notEligible}
                            className="flex-[2] bg-[var(--primary-color)] text-white rounded-md py-1.5 cursor-pointer flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Send className="size-4" />
                            {saving ? "Mengirim..." : "Kirim Notifikasi"}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

export default AppNotificationForm;