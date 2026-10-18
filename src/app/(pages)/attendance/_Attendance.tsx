"use client";
import { Label } from "@/components/ui/label";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { checkAttendance, insertOrUpdateAttendance } from "@/lib/attendance";
import Lottie from "lottie-react";
import successAnimation from "@/../public/assets/animation/successAnimation.json";
import failedAnimation from "@/../public/assets/animation/failedAnimation.json";
import Clock from "@/components/Clock";
import { userStore } from "@/store/user";
import AttendanceCapture from "@/components/popup/attendance-capture";
import { ATTENDANCE_LABELS } from "@/constants/attendance";
import { getAttendanceCities } from "@/config/access";
import { AttendanceGeo, AttendanceType } from "@/types/attendance";

const STATUS_DURATION_MS = 4000;

type CardKey = "attendance" | "rest";

type CardConfig = {
  key: CardKey;
  title: string;
  buttonLabel: string;
  options: { value: AttendanceType; activeClass: string }[];
};

const CARDS: CardConfig[] = [
  {
    key: "attendance",
    title: "ABSENSI",
    buttonLabel: "Konfirmasi Absensi",
    options: [
      { value: "clock_in", activeClass: "text-green-600" },
      { value: "clock_out", activeClass: "text-red-600" },
    ],
  },
  {
    key: "rest",
    title: "ISTIRAHAT",
    buttonLabel: "Konfirmasi Istirahat",
    options: [
      { value: "rest_start", activeClass: "text-blue-600" },
      { value: "rest_end", activeClass: "text-purple-600" },
    ],
  },
];

type StaffOption = { uid: string; name: string };

type Selection = { userId: string; type: AttendanceType | "" };

const EMPTY_SELECTION: Selection = { userId: "", type: "" };

type CaptureState = {
  cardKey: CardKey;
  userId: string;
  staffName: string;
  type: AttendanceType;
};

type StatusState = {
  cardKey: CardKey;
  success: boolean;
  message: string;
  staffName: string;
};

const Page = () => {
  const user = userStore((state: any) => state.user);
  const fetchUser = userStore((state: any) => state.fetchUser);

  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [selections, setSelections] = useState<Record<CardKey, Selection>>({
    attendance: EMPTY_SELECTION,
    rest: EMPTY_SELECTION,
  });
  const [checkingCard, setCheckingCard] = useState<CardKey | null>(null);
  const [capture, setCapture] = useState<CaptureState | null>(null);
  const [status, setStatus] = useState<StatusState | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cities = useMemo(() => getAttendanceCities(user), [user]);
  const cityKey = cities ? cities.join(",") : "ALL";

  useEffect(() => {
    if (!user.role) return;
    const loadStaff = async () => {
      const res = await fetchUsersByRole("Staff");
      if (res.success && res.data) {
        setStaffList(
          res.data.filter(
            (staff: StaffOption & { location?: string }) =>
              !cities || cities.includes(staff.location ?? "")
          )
        );
      }
    };
    loadStaff();
  }, [user.role, cityKey]);

  useEffect(() => {
    fetchUser();
    return () => {
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
  }, []);

  const updateSelection = (cardKey: CardKey, patch: Partial<Selection>) => {
    setSelections((prev) => ({
      ...prev,
      [cardKey]: { ...prev[cardKey], ...patch },
    }));
  };

  const showStatus = (next: StatusState) => {
    setSelections((prev) => ({ ...prev, [next.cardKey]: EMPTY_SELECTION }));
    setStatus(next);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(null), STATUS_DURATION_MS);
  };

  const handleSubmit = async (cardKey: CardKey) => {
    const { userId, type } = selections[cardKey];
    if (!userId || !type || checkingCard || capture) return;

    const staff = staffList.find((item) => item.uid === userId);
    if (!staff) return;

    setCheckingCard(cardKey);
    const result = await checkAttendance(userId, type);
    setCheckingCard(null);

    if (!result.success) {
      showStatus({
        cardKey,
        success: false,
        message: result.message,
        staffName: staff.name,
      });
      return;
    }

    setCapture({ cardKey, userId, staffName: staff.name, type });
  };

  const handleCaptureConfirm = async (payload: {
    photo: string;
    location: AttendanceGeo;
  }) => {
    if (!capture) return;
    const result = await insertOrUpdateAttendance(
      capture.userId,
      capture.type,
      payload
    );
    setCapture(null);
    showStatus({
      cardKey: capture.cardKey,
      success: result.success,
      message: result.message,
      staffName: capture.staffName,
    });
  };

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">Absensi</Label>
      <div className="w-full flex flex-col xl:flex-row justify-center gap-20 sm:gap-5 items-center min-h-[80dvh]">
        {CARDS.map((card) => (
          <AttendanceCard
            key={card.key}
            card={card}
            staffList={staffList}
            selection={selections[card.key]}
            status={status?.cardKey === card.key ? status : null}
            checking={checkingCard === card.key}
            onChange={(patch) => updateSelection(card.key, patch)}
            onSubmit={() => handleSubmit(card.key)}
          />
        ))}
      </div>
      {capture && (
        <AttendanceCapture
          staffName={capture.staffName}
          attendanceType={capture.type}
          onCancel={() => setCapture(null)}
          onConfirm={handleCaptureConfirm}
        />
      )}
    </div>
  );
};

export default Page;

type AttendanceCardProps = {
  card: CardConfig;
  staffList: StaffOption[];
  selection: Selection;
  status: StatusState | null;
  checking: boolean;
  onChange: (patch: Partial<Selection>) => void;
  onSubmit: () => void;
};

const AttendanceCard = ({
  card,
  staffList,
  selection,
  status,
  checking,
  onChange,
  onSubmit,
}: AttendanceCardProps) => {
  const [open, setOpen] = useState(false);
  const selectedStaff = staffList.find((staff) => staff.uid === selection.userId);
  const canSubmit = !!selection.userId && !!selection.type && !checking;

  return (
    <div
      className={cn(
        "sm:shadow-xl flex flex-col sm:flex-row justify-center items-center gap-5 sm:gap-14 rounded-md sm:h-80 sm:w-[38rem] sm:border",
        !status && "bg-white/50",
        status?.success && "bg-green-500/30",
        status && !status.success && "bg-red-500/30"
      )}
    >
      {status ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center text-center px-6 py-4"
        >
          <Lottie
            className="size-48"
            animationData={status.success ? successAnimation : failedAnimation}
            loop={true}
          />
          <p className="text-lg font-semibold text-gray-800">
            {status.message}
          </p>
          <p className="text-sm text-gray-600">{status.staffName}</p>
        </div>
      ) : (
        <>
          <Clock />
          <div className="flex flex-col justify-center items-start gap-5">
            <div className="w-full">
              <h1 className="text-lg font-bold -mb-5 text-end">{card.title}</h1>
            </div>
            <div className="flex flex-col justify-start gap-2">
              <Label>Nama Karyawan: </Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`w-[300px] justify-between ${selectedStaff?.name ? "text-gray-800" : "text-gray-500"
                      }`}
                  >
                    {selectedStaff?.name || "Pilih Karyawan..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Cari karyawan..." />
                    <CommandList>
                      <CommandEmpty>Karyawan tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {staffList.map((staff) => (
                          <CommandItem
                            key={staff.uid}
                            value={`${staff.name}__${staff.uid}`}
                            keywords={[staff.name]}
                            onSelect={() => {
                              onChange({
                                userId:
                                  staff.uid === selection.userId ? "" : staff.uid,
                              });
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selection.userId === staff.uid
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
                {card.options.map((option, index) => (
                  <React.Fragment key={option.value}>
                    {index > 0 && <Separator orientation="vertical" />}
                    <button
                      type="button"
                      aria-pressed={selection.type === option.value}
                      className={cn(
                        "flex-1 text-sm cursor-pointer",
                        index === 0 ? "pl-1 text-left" : "pr-1 text-right",
                        selection.type === option.value
                          ? `${option.activeClass} font-semibold`
                          : "text-gray-600"
                      )}
                      onClick={() => onChange({ type: option.value })}
                    >
                      {ATTENDANCE_LABELS[option.value]}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className={cn(
                "w-full rounded-md py-1.5 text-white",
                canSubmit
                  ? "bg-[var(--primary-color)] cursor-pointer"
                  : "bg-gray-600 cursor-not-allowed"
              )}
            >
              {checking ? "Memeriksa..." : card.buttonLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
};