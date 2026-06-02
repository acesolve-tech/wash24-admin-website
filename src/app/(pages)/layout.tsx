"use client";

import { useEffect, useState } from "react";
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

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = userStore((state: any) => state.user);
  const fetchUser = userStore((state: any) => state.fetchUser);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = async () => {
    const result = await logout();

    console.log("test");
    router.push("/");
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
              {SIDEBAR_ITEMS.filter((item) => {
                if (!item.role) return true;
                return item.role.includes(user.role);
              }).map((item) => {
                const hasSubItems = "subItems" in item;
                const isOpen = openMenus[item.title];

                return (
                  <div key={item.title}>
                    {hasSubItems ? (
                      <div
                        onClick={() => toggleMenu(item.title)}
                        className="w-full text-left font-medium text-gray-800 hover:text-black py-3 px-1 flex justify-between items-center text-lg border-b hover:border-gray-400 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          {item.title}
                        </div>
                        {hasSubItems &&
                          (isOpen ? (
                            <ChevronUp className="w-5" />
                          ) : (
                            <ChevronDown className="w-5" />
                          ))}
                      </div>
                    ) : (
                      <Link
                        href={item.path}
                        className={`font-medium text-gray-800 hover:text-black p-3 px-1 flex justify-between items-center text-lg border-b hover:border-gray-400`}
                      >
                        <div className="flex justify-center items-center gap-3">
                          {item.icon}
                          {item.title}
                        </div>
                        <div className="">
                          {"subItems" in item && (
                            <ChevronDown className="w-5 aspect-square" />
                          )}
                        </div>
                      </Link>
                    )}

                    {hasSubItems && isOpen && (
                      <div className="mx-3 pb-2 flex flex-col">
                        {item.subItems
                          .filter((sub) => {
                            if (user.role === "Master") return true;

                            if (user.location === "Malang") {
                              return sub.title === "Malang";
                            }

                            if (user.location === "Jakarta") {
                              if (user.email?.startsWith("jktselatan")) {
                                return sub.title === "Jakarta Selatan";
                              }
                              if (user.email?.startsWith("jktpusat")) {
                                return sub.title === "Jakarta Pusat";
                              }
                            }

                            if (user.location === "Surabaya") {
                              // if (user.email?.startsWith("sbypusat")) {
                              //   return sub.title === "Surabaya Pusat";
                              // }
                              // if (user.email?.startsWith("sbytimur")) {
                              //   return sub.title === "Surabaya Timur";
                              // }
                              if (
                                user.email?.startsWith("sbypusat") ||
                                user.email?.startsWith("sbytimur")
                              ) {
                                return (
                                  sub.title === "Surabaya Pusat" ||
                                  sub.title === "Surabaya Timur"
                                );
                              }
                              if (user.email?.startsWith("sbybarat")) {
                                return sub.title === "Surabaya Barat";
                              }
                              if (user.email?.startsWith("sbyselatan")) {
                                return sub.title === "Surabaya Selatan";
                              }
                            }

                            if (user.location === "Hotel Karpet") {
                              return sub.title === "Hotel dan Karpet";
                            }

                            return false;
                          })
                          .map((sub) => (
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
                onClick={handleLogout}
                className={`mt-auto font-medium text-gray-800 hover:text-black p-3 px-1 flex justify-between items-center text-lg border-b cursor-pointer hover:border-gray-400`}
              >
                <div className="flex justify-center items-center gap-2">
                  <LogOut className="w-7 aspect-square" />
                  Logout
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
