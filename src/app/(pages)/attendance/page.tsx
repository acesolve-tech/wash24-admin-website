"use client";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { fetchUsersByRole } from "@/lib/staff";
import { insertOrUpdateAttendance } from "@/lib/attendance";
import Lottie from "lottie-react";
import successAnimation from "@/../public/assets/animation/successAnimation.json";
import failedAnimation from "@/../public/assets/animation/failedAnimation.json";
import Clock from "@/components/Clock";
import { userStore } from "@/store/user";

const Page = () => {
  const user = userStore((state: any) => state.user);
  const fetchUser = userStore((state: any) => state.fetchUser);
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);

  const [userId, setUserId] = useState("");
  const [attendanceType, setAttendanceType] = useState("");
  const [staffList, setStaffList] = useState<{ uid: string; name: string }[]>(
    []
  );
  const [showStatus, setShowStatus] = useState({
    ongoing: false,
    status: false,
  });

  useEffect(() => {
    const loadStaff = async () => {
      const res = await fetchUsersByRole("Staff", user.location);
      if (res.success && res.data) {
        setStaffList(res.data);
      }
    };
    loadStaff();
  }, [user.location]);

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSubmit = async () => {
    if (!userId || !attendanceType) return;

    const result = await insertOrUpdateAttendance(userId, attendanceType);
    if (result?.success) {
      setShowStatus({ ongoing: true, status: true });
    } else {
      setShowStatus({ ongoing: false, status: false });
    }

    setUserId("");
    setAttendanceType("");
    setTimeout(() => {
      setShowStatus({ ongoing: false, status: false });
    }, 3000);
  };

  const selectedStaff = staffList.find((staff) => staff.uid === userId);

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">Absensi</Label>
      <div className="w-full flex flex-col xl:flex-row justify-center gap-20 sm:gap-5 items-center min-h-[80dvh]">
        <div
          className={`${
            showStatus.ongoing && showStatus.status && "bg-green-500/30"
          } ${showStatus.ongoing && !showStatus.status && "bg-red-500/30"} ${
            !showStatus.ongoing && "bg-white/50 "
          } sm:shadow-xl flex flex-col sm:flex-row justify-center items-center gap-5 sm:gap-14 rounded-md sm:h-80 sm:w-[38rem] sm:border`}
        >
          {showStatus.ongoing && (
            <Lottie
              className="size-80"
              animationData={
                (showStatus.ongoing && showStatus.status && successAnimation) ||
                (showStatus.ongoing && !showStatus.status && failedAnimation)
              }
              loop={true}
            />
          )}
          {!showStatus.ongoing && <Clock key="clock-1" />}
          {!showStatus.ongoing && (
            <div className="flex flex-col justify-center items-start gap-5">
              <div className="w-full">
                <h1 className="text-lg font-bold -mb-5 text-end">ABSENSI</h1>
              </div>
              <div className="flex flex-col justify-start gap-2">
                <Label>Nama Karyawan: </Label>
                <Popover open={open1} onOpenChange={setOpen1}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open1}
                      className={`w-[300px] justify-between ${
                        selectedStaff?.name ? "text-gray-800" : "text-gray-500"
                      }`}
                    >
                      {selectedStaff?.name || "Pilih Karyawan..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search staff..." />
                      <CommandList>
                        <CommandEmpty>No staff found.</CommandEmpty>
                        <CommandGroup>
                          {staffList.map((staff) => (
                            <CommandItem
                              key={staff.uid}
                              value={staff.uid}
                              onSelect={(currentValue) => {
                                setUserId(
                                  currentValue === userId ? "" : currentValue
                                );
                                setOpen1(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  userId === staff.uid
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {staff.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col justify-start gap-3">
                <Label className="mb-2">Jenis Absensi: </Label>
                <div className="flex justify-between gap-3 h-7 w-72">
                  <span
                    className={`flex-1 pl-1 text-sm cursor-pointer ${
                      attendanceType === "clock_in"
                        ? "text-green-600 font-semibold"
                        : "text-gray-600"
                    }`}
                    onClick={() => setAttendanceType("clock_in")}
                  >
                    Datang Kerja
                  </span>
                  <Separator orientation="vertical" />
                  <span
                    className={`flex-1 text-right pr-1 text-sm cursor-pointer ${
                      attendanceType === "clock_out"
                        ? "text-red-600 font-semibold"
                        : "text-gray-600"
                    }`}
                    onClick={() => setAttendanceType("clock_out")}
                  >
                    Pulang Kerja
                  </span>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                className={`w-full rounded-md py-1.5 ${
                  userId && attendanceType
                    ? "bg-[var(--primary-color)] cursor-pointer"
                    : "bg-gray-600 cursor-not-allowed"
                } text-white`}
              >
                Konfirmasi Absensi
              </button>
            </div>
          )}
        </div>
        <div
          className={`${
            showStatus.ongoing && showStatus.status && "bg-green-500/30"
          } ${showStatus.ongoing && !showStatus.status && "bg-red-500/30"} ${
            !showStatus.ongoing && "bg-white/50 "
          } sm:shadow-xl flex flex-col sm:flex-row justify-center items-center gap-5 sm:gap-14 rounded-md sm:h-80 sm:w-[38rem] sm:border`}
        >
          {showStatus.ongoing && (
            <Lottie
              className="size-80"
              animationData={
                (showStatus.ongoing && showStatus.status && successAnimation) ||
                (showStatus.ongoing && !showStatus.status && failedAnimation)
              }
              loop={true}
            />
          )}
          {!showStatus.ongoing && <Clock key="clock-2" />}
          {!showStatus.ongoing && (
            <div className="flex flex-col justify-center items-start gap-5">
              <div className="w-full">
                <h1 className="text-lg font-bold -mb-5 text-end">ISTIRAHAT</h1>
              </div>
              <div className="flex flex-col justify-start gap-2">
                <Label>Nama Karyawan: </Label>
                <Popover open={open2} onOpenChange={setOpen2}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open2}
                      className={`w-[300px] justify-between ${
                        selectedStaff?.name ? "text-gray-800" : "text-gray-500"
                      }`}
                    >
                      {selectedStaff?.name || "Pilih Karyawan..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search staff..." />
                      <CommandList>
                        <CommandEmpty>No staff found.</CommandEmpty>
                        <CommandGroup>
                          {staffList.map((staff) => (
                            <CommandItem
                              key={staff.uid}
                              value={staff.uid}
                              onSelect={(currentValue) => {
                                setUserId(
                                  currentValue === userId ? "" : currentValue
                                );
                                setOpen2(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  userId === staff.uid
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {staff.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col justify-start gap-3">
                <Label className="mb-2">Jenis Absensi: </Label>
                <div className="flex justify-between gap-3 h-7 w-72">
                  <span
                    className={`flex-1 pl-1 text-sm cursor-pointer ${
                      attendanceType === "rest_start"
                        ? "text-blue-600 font-semibold"
                        : "text-gray-600"
                    }`}
                    onClick={() => setAttendanceType("rest_start")}
                  >
                    Mulai Istirahat
                  </span>
                  <Separator orientation="vertical" />
                  <span
                    className={`flex-1 text-right pr-1 text-sm cursor-pointer ${
                      attendanceType === "rest_end"
                        ? "text-purple-600 font-semibold"
                        : "text-gray-600"
                    }`}
                    onClick={() => setAttendanceType("rest_end")}
                  >
                    Selesai Istirahat
                  </span>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                className={`w-full rounded-md py-1.5 ${
                  userId && attendanceType
                    ? "bg-[var(--primary-color)] cursor-pointer"
                    : "bg-gray-600 cursor-not-allowed"
                } text-white`}
              >
                Konfirmasi Istirahat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
