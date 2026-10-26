"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
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
import AppCustomerForm from "@/components/popup/app-customer-form";
import AppCustomerTierBadge from "@/components/app-customer-tier-badge";
import { APP_CUSTOMER_PAGE_SIZE } from "@/constants/app-customers";
import { fetchAppCustomers } from "@/lib/app-customers";
import { formatDate } from "@/lib/format";
import { formatPhoneDisplay, phoneMatches, phoneToRouteId } from "@/lib/phone";
import { userStore } from "@/store/user";
import { AppCustomer } from "@/types/app-customer";

const detailPath = (customer: AppCustomer) => `/app-customers/${phoneToRouteId(customer.phone)}`;

const AppCustomersPage = () => {
    const user = userStore((state: any) => state.user);
    const router = useRouter();

    const [customers, setCustomers] = useState<AppCustomer[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [visibleCount, setVisibleCount] = useState(APP_CUSTOMER_PAGE_SIZE);
    const [formOpen, setFormOpen] = useState(false);

    const loadCustomers = useCallback(async () => {
        setLoading(true);
        const result = await fetchAppCustomers();
        setLoading(false);
        setLoaded(true);
        if (!result.success) {
            setError(result.message);
            return;
        }
        setError("");
        setCustomers(result.data);
    }, []);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return customers;
        return customers.filter(
            (customer) =>
                customer.name.toLowerCase().includes(query) || phoneMatches(customer.phone, query)
        );
    }, [customers, search]);

    const visible = filtered.slice(0, visibleCount);
    const closeForm = useCallback(() => setFormOpen(false), []);

    return (
        <div className="min-h-[calc(100dvh-40px)] space-y-6">
            <div className="space-y-1 pr-24">
                <Label className="text-3xl font-bold w-fit">Customer App</Label>
                <p className="text-sm text-gray-600">
                    Customer yang terdaftar di app, lewat OTP maupun didaftarkan admin.
                    {loaded && !error && ` Total ${customers.length.toLocaleString("id-ID")} customer.`}
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setVisibleCount(APP_CUSTOMER_PAGE_SIZE);
                        }}
                        placeholder="Cari nama atau nomor HP"
                        aria-label="Cari customer"
                        className="pl-9"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setFormOpen(true)}
                    disabled={!loaded}
                    className="cursor-pointer ml-auto bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-1.5 rounded-md disabled:opacity-50"
                >
                    + Daftarkan Customer
                </button>
            </div>

            {error && (
                <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={loadCustomers}
                        className="font-semibold cursor-pointer hover:underline"
                    >
                        Muat ulang
                    </button>
                </div>
            )}

            {loaded && !error && (
                <div className="rounded-md border w-full bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead className="hidden sm:table-cell">No. HP</TableHead>
                                <TableHead className="hidden md:table-cell">Tier</TableHead>
                                <TableHead className="hidden md:table-cell">Terdaftar</TableHead>
                                <TableHead className="w-8" aria-label="Buka" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visible.map((customer) => (
                                <TableRow
                                    key={customer.phone}
                                    onClick={() => router.push(detailPath(customer))}
                                    className="cursor-pointer"
                                >
                                    <TableCell>
                                        <div className="min-w-0 sm:min-w-48">
                                            <Link
                                                href={detailPath(customer)}
                                                onClick={(event) => event.stopPropagation()}
                                                className="font-medium text-gray-900 hover:underline"
                                            >
                                                {customer.name || "(tanpa nama)"}
                                            </Link>
                                            <p className="sm:hidden text-xs text-gray-600">
                                                {formatPhoneDisplay(customer.phone)}
                                            </p>
                                            <p
                                                className="text-xs text-gray-500 max-w-64 sm:max-w-80 truncate"
                                                title={customer.address}
                                            >
                                                {customer.address || "-"}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell whitespace-nowrap">
                                        {formatPhoneDisplay(customer.phone)}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <AppCustomerTierBadge customer={customer} />
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell whitespace-nowrap">
                                        {formatDate(customer.createdAt)}
                                        <p className="text-xs text-gray-500">
                                            {customer.source === "admin" ? "Didaftarkan admin" : "Lewat app"}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <ChevronRight className="size-4 text-gray-400" aria-hidden />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {visible.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                        {search.trim()
                                            ? `Tidak ada customer yang cocok dengan "${search.trim()}".`
                                            : "Belum ada customer."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {filtered.length > visible.length && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={() => setVisibleCount((count) => count + APP_CUSTOMER_PAGE_SIZE)}
                        className="cursor-pointer rounded-md border border-gray-300 px-5 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Tampilkan lebih banyak ({filtered.length - visible.length} lagi)
                    </button>
                </div>
            )}

            {formOpen && (
                <AppCustomerForm
                    customer={null}
                    actorEmail={user.email}
                    onClose={closeForm}
                    onSaved={(phone) => router.push(`/app-customers/${phoneToRouteId(phone)}`)}
                />
            )}
            {loading && <Loading />}
        </div>
    );
};

export default AppCustomersPage;