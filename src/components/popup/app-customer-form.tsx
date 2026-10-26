"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { APP_CUSTOMER_RULES } from "@/constants/app-customers";
import { createAppCustomer, updateAppCustomer } from "@/lib/app-customers";
import { formatPhoneDisplay, normalizePhone, phoneToRouteId } from "@/lib/phone";
import { AppCustomer } from "@/types/app-customer";

interface AppCustomerFormProps {
    customer: AppCustomer | null;
    actorEmail: string;
    onClose: () => void;
    onSaved: (phone: string) => void;
}

function todayInputValue() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const textareaClass =
    "placeholder:text-muted-foreground border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none resize-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[0.5px] disabled:cursor-not-allowed disabled:opacity-50";

function AppCustomerForm({ customer, actorEmail, onClose, onSaved }: AppCustomerFormProps) {
    const isEdit = !!customer;

    const [phone, setPhone] = useState("");
    const [name, setName] = useState(customer?.name ?? "");
    const [address, setAddress] = useState(customer?.address ?? "");
    const [birthDate, setBirthDate] = useState(customer?.birthDate ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [existingPhone, setExistingPhone] = useState<string | null>(null);

    const normalizedPhone = normalizePhone(phone);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !saving) onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [saving, onClose]);

    const edit = (setter: (value: string) => void) => (value: string) => {
        setError("");
        setExistingPhone(null);
        setter(value);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (saving) return;

        setSaving(true);
        setError("");
        setExistingPhone(null);

        const input = { phone, name, address, birthDate };
        if (isEdit && customer) {
            const result = await updateAppCustomer(customer.phone, input, actorEmail);
            setSaving(false);
            if (!result.success) return setError(result.message);
            return onSaved(customer.phone);
        }

        const result = await createAppCustomer(input, actorEmail);
        setSaving(false);
        if (!result.success) {
            setError(result.message);
            if (result.data.exists) setExistingPhone(result.data.phone);
            return;
        }
        onSaved(result.data.phone);
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
                aria-labelledby="app-customer-form-title"
                className="w-full sm:w-[460px] bg-white rounded-md p-7 max-h-[90dvh] overflow-y-auto"
            >
                <Label id="app-customer-form-title" className="text-xl font-semibold mb-5 block">
                    {isEdit ? "Ubah Data Customer" : "Daftarkan Customer"}
                </Label>

                <div className="grid w-full items-center gap-1.5 mb-5">
                    <Label htmlFor="customer-phone">No. HP (WhatsApp)</Label>
                    {isEdit && customer ? (
                        <>
                            <p id="customer-phone" className="text-sm font-medium text-gray-900">
                                {formatPhoneDisplay(customer.phone)}
                            </p>
                            <span className="text-xs text-gray-500">
                                Nomor tidak bisa diubah karena dipakai sebagai ID akun customer.
                            </span>
                        </>
                    ) : (
                        <>
                            <Input
                                id="customer-phone"
                                autoFocus
                                type="tel"
                                inputMode="tel"
                                autoComplete="off"
                                value={phone}
                                onChange={(event) => edit(setPhone)(event.target.value)}
                                placeholder="081234567890"
                                disabled={saving}
                            />
                            <span className="text-xs text-gray-500 pl-0.5">
                                {phone.trim()
                                    ? normalizedPhone
                                        ? `Disimpan sebagai ${formatPhoneDisplay(normalizedPhone)}`
                                        : "Nomor belum lengkap atau tidak valid."
                                    : "Nomor ini dipakai customer untuk login OTP di app."}
                            </span>
                        </>
                    )}
                </div>

                <div className="grid w-full items-center gap-1.5 mb-5">
                    <Label htmlFor="customer-name">Nama lengkap</Label>
                    <Input
                        id="customer-name"
                        autoFocus={isEdit}
                        value={name}
                        maxLength={APP_CUSTOMER_RULES.nameMax}
                        onChange={(event) => edit(setName)(event.target.value)}
                        placeholder="Nama customer"
                        disabled={saving}
                    />
                </div>

                <div className="grid w-full items-center gap-1.5 mb-5">
                    <div className="flex justify-between items-end">
                        <Label htmlFor="customer-address">Alamat</Label>
                        <span className="text-xs text-gray-400">
                            {address.length}/{APP_CUSTOMER_RULES.addressMax}
                        </span>
                    </div>
                    <textarea
                        id="customer-address"
                        rows={3}
                        value={address}
                        maxLength={APP_CUSTOMER_RULES.addressMax}
                        onChange={(event) => edit(setAddress)(event.target.value)}
                        placeholder="Alamat lengkap untuk penjemputan"
                        disabled={saving}
                        className={textareaClass}
                    />
                </div>

                <div className="grid w-full items-center gap-1.5 mb-5">
                    <Label htmlFor="customer-birth-date">Tanggal lahir</Label>
                    <Input
                        id="customer-birth-date"
                        type="date"
                        value={birthDate}
                        max={todayInputValue()}
                        onChange={(event) => edit(setBirthDate)(event.target.value)}
                        disabled={saving}
                    />
                </div>

                {!isEdit && (
                    <p className="mb-5 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        Setelah didaftarkan, customer bisa login di app dengan nomor ini lewat OTP WhatsApp
                        tanpa mengisi data diri lagi, dan semua pesanannya terlihat di Riwayat app.
                    </p>
                )}

                {error && (
                    <div role="alert" className="mb-3 text-sm text-red-600">
                        <p>{error}</p>
                        {existingPhone && (
                            <Link
                                href={`/app-customers/${phoneToRouteId(existingPhone)}`}
                                className="font-semibold underline"
                            >
                                Buka data customer ini
                            </Link>
                        )}
                    </div>
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
                        {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Daftarkan"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AppCustomerForm;