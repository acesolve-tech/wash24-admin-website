"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Info, Pen } from "lucide-react";
import { Label } from "@/components/ui/label";
import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow, 
} from "@/components/ui/table";
import Loading from "@/components/Loading";
import AppServiceIcon from "@/components/app-service-icon";
import AppServiceForm from "@/components/popup/app-service-form";
import { canManageAppCatalog } from "@/config/access";
import { APP_SERVICE_SEED } from "@/constants/app-services";
import { fetchAppServices, moveAppService, seedAppServices } from "@/lib/app-services";
import { formatDuration, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";
import { userStore } from "@/store/user";
import { AppService } from "@/types/app-service";

type FormState = { open: false } | { open: true; service: AppService | null };

const AppServicesPage = () => {
    const user = userStore((state: any) => state.user);
    const canManage = canManageAppCatalog(user);

    const [services, setServices] = useState<AppService[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState<FormState>({ open: false });

    const loadServices = useCallback(async () => {
        setLoading(true);
        const result = await fetchAppServices();
        setLoading(false);
        setLoaded(true);
        if (!result.success) {
            setError(result.message);
            return;
        }
        setError("");
        setServices(result.data);
    }, []);

    useEffect(() => {
        loadServices();
    }, [loadServices]);

    const closeForm = useCallback(() => setForm({ open: false }), []);

    const handleSaved = () => {
        setForm({ open: false });
        loadServices();
    };

    const handleMove = async (index: number, direction: -1 | 1) => {
        if (busy) return;
        setBusy(true);
        const result = await moveAppService(services, index, direction, user.email);
        setBusy(false);
        if (!result.success) {
            setError(result.message);
            return;
        }
        setError("");
        setServices(result.data);
    };

    const handleSeed = async () => {
        if (busy) return;
        setBusy(true);
        const result = await seedAppServices(user.email);
        setBusy(false);
        if (!result.success) {
            setError(result.message);
            return;
        }
        loadServices();
    };

    const activeCount = services.filter((service) => service.active).length;
    const isEmpty = loaded && !error && services.length === 0;

    return (
        <div className="min-h-[calc(100dvh-40px)] space-y-6">
            <div className="space-y-1 pr-24">
                <Label className="text-3xl font-bold w-fit">Layanan App</Label>
                <p className="text-sm text-gray-600">
                    Daftar layanan dan harga yamg tampil di app customer.
                    {services.length > 0 && ` ${activeCount} dari ${services.length} layanan aktif.`}
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                {canManage ? (
                    <p className="text-xs text-gray-500">
                        Urutan di tabel = urutan yang tampil di app. Layanan nonaktif disembunyikan dari app.
                    </p>
                ) : (
                    <p className="flex items-center gap-2 text-xs text-gray-600 rounded-md bg-gray-50 border px-3 py-2">
                        <Info className="size-4 shrink-0" />
                        Hanya akun Master yang bisa mengbubah layanan dan harga.
                    </p>
                )}
                {canManage && !isEmpty && (
                    <button
                        type="button"
                        onClick={() => setForm({ open: true, service: null })}
                        disabled={!loaded || busy}
                        className="cursor-pointer ml-auto bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-1.5 rounded-md disabled:opacity-50"
                    >
                        + Tambah Layanan
                    </button>
                )}
            </div>

            {error && (
                <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={loadServices}
                        className="font-semibold cursor-pointer hover:underline"
                    >
                        Muat ulang
                    </button>
                </div>
            )}

            {isEmpty ? (
                <div className="rounded-md border bg-white px-6 py-10 text-center">
                    <p className="font-semibold text-gray-800">Belum ada layanan di katalog</p>
                    <p className="mt-1 text-sm text-gray-600">
                        {canManage
                            ? `Mulai dengan ${APP_SERVICE_SEED.length} layanan yang sekarang ada di app, lalu ubah harganya kalau perlu.`
                            : "Minta akun Master untuk mengisi katalog layanan."}
                    </p>
                    {canManage && (
                        <div className="mt-5 flex flex-wrap justify-center gap-2">
                            <button
                                type="button"
                                onClick={handleSeed}
                                disabled={busy}
                                className="cursor-pointer bg-[var(--primary-color)] hover:bg-[#301094] text-white px-5 py-1.5 rounded-md disabled:opacity-50"
                            >
                                {busy ? "Menyimpan..." : `Isi ${APP_SERVICE_SEED.length} layanan awal`}
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ open: true, service: null })}
                                disabled={busy}
                                className="cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-1.5 rounded-md disabled:opacity-50"
                            >
                                Tambah manual
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                services.length > 0 && (
                    <div className="rounded-md border w-full bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {canManage && <TableHead className="w-16">Urutan</TableHead>}
                                    <TableHead>Layanan</TableHead>
                                    <TableHead className="hidden sm:table-cell">Harga</TableHead>
                                    <TableHead className="hidden sm:table-cell">Estimasi</TableHead>
                                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                                    {canManage && <TableHead className="w-10" aria-label="Aksi" />}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.map((service, index) => (
                                    <TableRow key={service.id}>
                                        {canManage && (
                                            <TableCell>
                                                <div className="flex items-center gap-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMove(index, -1)}
                                                        disabled={busy || index === 0}
                                                        aria-label={`Naikkan ${service.name}`}
                                                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent"
                                                    >
                                                        <ChevronUp className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMove(index, 1)}
                                                        disabled={busy || index === services.length - 1}
                                                        aria-label={`Turunkan ${service.name}`}
                                                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent"
                                                    >
                                                        <ChevronDown className="size-4" />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell className={cn(!service.active && "opacity-50")}>
                                            <div className="flex items-center gap-3 sm:min-w-56">
                                                <AppServiceIcon name={service.icon} />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900">{service.name || "-"}</p>
                                                    <p
                                                        className="hidden sm:block text-xs text-gray-500 max-w-80 truncate"
                                                        title={service.description}
                                                    >
                                                        {service.description || "-"}
                                                    </p>
                                                    <p className="sm:hidden text-xs text-gray-600 whitespace-normal">
                                                        {formatRupiah(service.price)} / {service.unit} ·{" "}
                                                        {formatDuration(service.durationHours)}
                                                        {!service.active && " · Nonaktif"}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell
                                            className={cn(
                                                "hidden sm:table-cell whitespace-nowrap",
                                                !service.active && "opacity-50"
                                            )}
                                        >
                                            {formatRupiah(service.price)}
                                            <span className="text-gray-500"> / {service.unit}</span>
                                        </TableCell>
                                        <TableCell
                                            className={cn(
                                                "hidden sm:table-cell whitespace-nowrap",
                                                !service.active && "opacity-50"
                                            )}
                                        >
                                            {formatDuration(service.durationHours)}
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <span
                                                className={cn(
                                                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                    service.active
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-gray-100 text-gray-600"
                                                )}
                                            >
                                                {service.active ? "Aktif" : "Nonaktif"}
                                            </span>
                                        </TableCell>
                                        {canManage && (
                                            <TableCell>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ open: true, service })}
                                                    disabled={busy}
                                                    aria-label={`Ubah ${service.name}`}
                                                    className="rounded p-1 text-gray-400 hover:text-gray-700 cursor-pointer disabled:opacity-30"
                                                >
                                                    <Pen className="size-4" />
                                                </button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )
            )}

            {form.open && (
                <AppServiceForm 
                    service={form.service}
                    services={services}
                    updatedBy={user.email}
                    onClose={closeForm}
                    onSaved={handleSaved}
                />
            )}
            {loading && <Loading />}
        </div>
    );
};

export default AppServicesPage;