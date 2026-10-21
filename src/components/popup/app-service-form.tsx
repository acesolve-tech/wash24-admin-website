"use client";
import React, { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { APP_SERVICE_ICON_OPTIONS } from "../app-service-icon";
import { cn } from "@/lib/utils";
import { formatDuration, formatRupiah } from "@/lib/format";
import { saveAppService } from "@/lib/app-services";
import { APP_SERVICE_LIMITS, APP_SERVICE_UNITS } from "@/constants/app-services";
import { AppService, AppServiceUnit } from "@/types/app-service";

type DurationMode = "jam" | "hari";

interface AppServiceFormProps {
    service: AppService | null;
    services: AppService[];
    updatedBy: string;
    onClose: () => void;
    onSaved: () => void;
}

const segmentClass =
    "px-4 cursor-pointer data-[state=on]:bg-[var(--primary-color)] data-[state=on]:text-white";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

function initialDuration(hours: number | undefined): { value: string; mode: DurationMode } {
    if (!hours) return { value: "", mode: "hari" };
    if (hours % 24 === 0) return { value: String(hours / 24), mode: "hari" };
    return { value: String(hours), mode: "jam" };
}

function AppServiceForm({ service, services, updatedBy, onClose, onSaved }: AppServiceFormProps) {
    const isEdit = !!service;
    const initial = initialDuration(service?.durationHours);

    const [name, setName] = useState(service?.name ?? "");
    const [price, setPrice] = useState(service?.price ? String(service.price) : "");
    const [unit, setUnit] = useState<AppServiceUnit>(service?.unit ?? "kg");
    const [durationValue, setDurationValue] = useState(initial.value);
    const [durationMode, setDurationMode] = useState<DurationMode>(initial.mode);
    const [icon, setIcon] = useState(service?.icon || APP_SERVICE_ICON_OPTIONS[0].name);
    const [description, setDescription] = useState(service?.description ?? "");
    const [active, setActive] = useState(service?.active ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const priceNumber = Number(price);
    const durationNumber = Number(durationValue);
    const durationHours = durationMode === "hari" ? durationNumber * 24 : durationNumber;

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !saving) onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [saving, onClose]);

    const edit =
        <T,>(setter: (value: T) => void) =>
            (value: T) => {
                setError("");
                setter(value);
            };

    const fallbackIcon = APP_SERVICE_ICON_OPTIONS[APP_SERVICE_ICON_OPTIONS.length - 1];
    const iconOptions = APP_SERVICE_ICON_OPTIONS.some((option) => option.name === icon)
        ? APP_SERVICE_ICON_OPTIONS
        : [{ ...fallbackIcon, name: icon, label: icon }, ...APP_SERVICE_ICON_OPTIONS];

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (saving) return;

        setSaving(true);
        setError("");
        const result = await saveAppService(
            service?.id ?? null,
            {
                name,
                icon,
                price: priceNumber,
                unit,
                description,
                durationHours,
                active,
            },
            services,
            updatedBy
        );
        setSaving(false);

        if (!result.success) {
            setError(result.message);
            return;
        }
        onSaved();
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
                aria-labelledby="app-service-form-title"
                className="w-full sm:w-[460px] bg-white rounded-md p-7 max-h-[90dvh] overflow-y-auto"
            >
                <Label id="app-service-form-title" className="text-xl font-semibold mb-5 block">
                    {isEdit ? "Ubah Layanan" : "Tambah Layanan"}
                </Label>

                <div className="grid w-full items-center gap-1.5 mb-5">
                    <Label htmlFor="service-name">Nama layanan</Label>
                    <Input
                        id="service-name"
                        autoFocus
                        value={name}
                        maxLength={APP_SERVICE_LIMITS.nameMax}
                        onChange={(event) => edit(setName)(event.target.value)}
                        placeholder="Contoh: Cuci Setrika"
                        disabled={saving}
                    />
                </div>

                <div className="grid w-full items-center gap-1.5 mb-5">
                    <Label htmlFor="service-price">Harga</Label>
                    <div className="flex gap-2">
                        <Input
                            id="service-price"
                            inputMode="numeric"
                            value={price}
                            onChange={(event) => edit(setPrice)(digitsOnly(event.target.value))}
                            placeholder="7000"
                            disabled={saving}
                        />
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            value={unit}
                            onValueChange={(value) => value && edit(setUnit)(value as AppServiceUnit)}
                            aria-label="Satuan"
                            className="h-9 shrink-0"
                            disabled={saving}
                        >
                            {APP_SERVICE_UNITS.map((option) => (
                                <ToggleGroupItem key={option.value} value={option.value} className={cn(segmentClass, "h-9")}>
                                    {option.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>
                    <span className="text-xs text-gray-500 pl-0.5">
                        {priceNumber > 0
                            ? `${formatRupiah(priceNumber)} / ${unit}. ${unit === "kg" ? "Jumlah boleh desimal, mis. 2,5 kg." : "Jumlah bilangan bulat."
                            }`
                            : "Harga per satuan, tanpa titik."}
                    </span>
                </div>

                <div className="grid w-full items-center gap-1.5 mb-5">
                    <Label htmlFor="service-duration">Estimasi pengerjaan</Label>
                    <div className="flex gap-2">
                        <Input
                            id="service-duration"
                            inputMode="numeric"
                            value={durationValue}
                            onChange={(event) => edit(setDurationValue)(digitsOnly(event.target.value))}
                            placeholder={durationMode === "hari" ? "2" : "12"}
                            disabled={saving}
                        />
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            size="sm"
                            value={durationMode}
                            onValueChange={(value) => value && edit(setDurationMode)(value as DurationMode)}
                            aria-label="Satuan estimasi"
                            className="h-9 shrink-0"
                            disabled={saving}
                        >
                            <ToggleGroupItem value="jam" className={cn(segmentClass, "h-9")}>
                                Jam
                            </ToggleGroupItem>
                            <ToggleGroupItem value="hari" className={cn(segmentClass, "h-9")}>
                                Hari
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                    {durationHours > 0 && (
                        <span className="text-xs text-gray-500 pl-0.5">
                            Tampil di app: {formatDuration(durationHours)}
                        </span>
                    )}
                </div>

                <div className="grid w-full gap-1.5 mb-5">
                    <Label id="service-icon-label">Ikon</Label>
                    <div
                        role="radiogroup"
                        aria-labelledby="service-icon-label"
                        className="grid grid-cols-6 gap-2"
                    >
                        {iconOptions.map(({ name: iconName, label, Icon }) => {
                            const selected = icon === iconName;
                            return (
                                <button
                                    key={iconName}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    aria-label={label}
                                    title={label}
                                    onClick={() => edit(setIcon)(iconName)}
                                    disabled={saving}
                                    className={cn(
                                        "aspect-square rounded-md border flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50",
                                        selected
                                            ? "border-[var(--primary-color)] bg-[#303094]/10 text-[var(--primary-color)]"
                                            : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
                                    )}
                                >
                                    <Icon className="size-5" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid w-full items-center gap-1.5 mb-5">
                    <div className="flex justify-between items-end">
                        <Label htmlFor="service-description">Deskripsi</Label>
                        <span className="text-xs text-gray-400">
                            {description.length}/{APP_SERVICE_LIMITS.descriptionMax}
                        </span>
                    </div>
                    <textarea
                        id="service-description"
                        rows={3}
                        value={description}
                        maxLength={APP_SERVICE_LIMITS.descriptionMax}
                        onChange={(event) => edit(setDescription)(event.target.value)}
                        placeholder="Penjelasan singkat yang tampil di app"
                        disabled={saving}
                        className="placeholder:text-muted-foreground border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none resize-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[0.5px] disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <div className="flex items-start gap-3 mb-5">
                    <Checkbox
                        id="service-active"
                        checked={active}
                        onCheckedChange={(checked) => edit(setActive)(checked === true)}
                        disabled={saving}
                        className="mt-0.5"
                    />
                    <div className="grid gap-1">
                        <Label htmlFor="service-active" className="cursor-pointer">
                            Tampilkan di app
                        </Label>
                        <span className="text-xs text-gray-500">
                            Kalau tidak dicentang, layanan disembunyikan dari app dan tidak bisa dipilih saat
                            mencatat pesanan.
                        </span>
                    </div>
                </div>

                {isEdit && (
                    <p className="mb-5 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        Perubahan harga dan satuan hanya berlaku untuk pesanan baru. Pesanan lama tetap memakai
                        harga saat dipesan.
                    </p>
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
                        {saving ? "Menyimpan..." : "Simpan Layanan"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AppServiceForm;
