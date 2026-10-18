"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SIDEBAR_ITEMS } from "@/constants";
import Link from "next/link";
import { ChevronDown, ChevronUp, CornerDownRight, LogOut } from "lucide-react";
import { userStore } from "@/store/user";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth/logout";
import { canAccessPath } from "@/config/access";
import { auth } from "@/config/firebase";
import { signOut } from "firebase/auth";
import { SidebarItem, SidebarItemWithSub } from "@/types/sidebar";

const hasSubItems = (item: SidebarItem): item is SidebarItemWithSub =>
  "subItems" in item && Array.isArray(item.subItems);

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = userStore((state: any) => state.user);
  const fetchUser = userStore((state: any) => state.fetchUser);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const menuItems = useMemo(
    () =>
      SIDEBAR_ITEMS.flatMap((item): SidebarItem[] => {
        if (hasSubItems(item)) {
          const subItems = item.subItems.filter((sub) =>
            canAccessPath(sub.path, user)
          );
          return subItems.length > 0 ? [{ ...item, subItems }] : [];
        }
        return canAccessPath(item.path, user) ? [item] : [];
      }),
    [user]
  );

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await Promise.allSettled([logout(), signOut(auth)]);
    } finally {
      router.replace("/");
    }
  };

  return (
    <div className="w-full min-h-screen">
      <header className="fixed top-0 right-0 rounded-bl-2xl flex justify-end items-center shadow-sm border z-10 bg-white">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant={"ghost"}
              className="text-lg px-7 py-6 pb-7 cursor-pointer text-gray-600 hover:text-gray-800"
            >
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader className="pb-2">
              <SheetTitle className="px-1 text-lg">
                {user.name} - <span className="text-gray-600">{user.role}</span>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col justify-start px-4 h-full pb-5 overflow-y-auto">
              {menuItems.map((item) => {
                const isOpen = openMenus[item.title];

                if (!hasSubItems(item)) {
                  return (
                    <Link
                      key={item.title}
                      href={item.path}
                      className="font-medium text-gray-800 hover:text-black p-3 px-1 flex justify-between items-center text-lg border-b hover:border-gray-400"
                    >
                      <div className="flex justify-center items-center gap-3">
                        {item.icon}
                        {item.title}
                      </div>
                    </Link>
                  );
                }

                return (
                  <div key={item.title}>
                    <button
                      type="button"
                      onClick={() => toggleMenu(item.title)}
                      aria-expanded={!!isOpen}
                      className="w-full text-left font-medium text-gray-800 hover:text-black py-3 px-1 flex justify-between items-center text-lg border-b hover:border-gray-400 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        {item.title}
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-5" />
                      ) : (
                        <ChevronDown className="w-5" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="mx-3 pb-2 flex flex-col">
                        {item.subItems.map((sub) => (
                          <Link
                            key={sub.title}
                            href={sub.path}
                            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-3 cursor-pointer py-3 border-b"
                          >
                            <CornerDownRight className="size-5 mb-0.5 opacity-50" />
                            <span className="text-base">{sub.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-auto font-medium text-gray-800 hover:text-black p-3 px-1 flex justify-between items-center text-lg border-b cursor-pointer hover:border-gray-400 disabled:opacity-50"
              >
                <div className="flex justify-center items-center gap-2">
                  <LogOut className="w-7 aspect-square" />
                  {loggingOut ? "Keluar..." : "Logout"}
                </div>
              </button>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      <section className="w-full p-5 min-h-screen">
        <div className="flex justify-center items-center w-screen h-screen fixed top-0 left-0 -z-10 opacity-5">
          <img src="/assets/logo.webp" className="w-96" alt="Wash24 Logo" />
        </div>
        {children}
      </section>
    </div>
  );
}