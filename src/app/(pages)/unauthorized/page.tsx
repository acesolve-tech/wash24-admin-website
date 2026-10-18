"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebase";
import { getHomePath, UNAUTHORIZED_PATH } from "@/config/access";
import { logout } from "@/lib/auth/logout";
import { userStore } from "@/store/user";

export default function UnauthorizedPage() {
  const user = userStore((state: any) => state.user);
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const homePath = getHomePath(user);
  const hasBranchAccess = homePath !== UNAUTHORIZED_PATH;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await Promise.allSettled([logout(), signOut(auth)]);
    } finally {
      router.replace("/");
    }
  };

  if (!user.role) {
    return (
      <div className="min-h-[calc(100dvh-40px)] flex items-center justify-center text-sm text-gray-500">
        Memuat...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-40px)] flex items-center justify-center px-2">
      <div className="w-full max-w-md rounded-md border bg-white p-7 text-center shadow-sm">
        <ShieldAlert className="mx-auto mb-3 size-10 text-red-600" />
        <h1 className="text-xl font-semibold">
          {hasBranchAccess ? "Tidak punya akses" : "Belum ada akses cabang"}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {hasBranchAccess
            ? "Akun Anda tidak diizinkan membuka halaman tersebut."
            : "Akun ini belum terdaftar ke cabang mana pun, atau cabangnya belum aktif. Hubungi Master untuk mendapatkan akses."}
        </p>
        <dl className="mt-4 rounded-md bg-gray-50 px-3 py-2 text-left text-xs text-gray-600">
          <div className="flex justify-between gap-3">
            <dt>Email</dt>
            <dd className="font-medium text-gray-800 break-all">{user.email || "-"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Role</dt>
            <dd className="font-medium text-gray-800">{user.role || "-"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Lokasi</dt>
            <dd className="font-medium text-gray-800">{user.location || "-"}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-col gap-2">
          {hasBranchAccess && (
            <Link
              href={homePath}
              className="w-full rounded-md bg-[var(--primary-color)] py-1.5 text-white hover:bg-[#301094]"
            >
              Kembali ke halaman utama
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full rounded-md border border-gray-300 py-1.5 text-gray-700 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
          >
            {loggingOut ? "Keluar..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}