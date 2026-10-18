"use client";
import { Label } from "@/components/ui/label";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DataTable } from "./data-table";
import { Attendance, AttendanceGeo, AttendanceType } from "@/types/attendance";
import { ATTENDANCE_LABELS } from "@/constants/attendance";
import { ColumnDef } from "@tanstack/react-table";
import { Timestamp } from "firebase/firestore";
import { Camera, MapPin, Pen } from "lucide-react";
import { fetchAttendance } from "@/lib/attendance";
import { userStore } from "@/store/user";
import { getAttendanceCities } from "@/config/access";
import { STAFF_CITIES } from "@/constants/locations";
import AttendanceReportForm from "@/components/popup/attendance-report-form";
import AttendanceDetailPreview from "@/components/popup/attendance-detail-preview";
import Loading from "@/components/Loading";

type DetailPreview = {
  title: string;
  staffName: string;
  photoUrl?: string;
  location?: AttendanceGeo;
} | null;

const Page = () => {
  const user = userStore((state: any) => state.user);
  const cities = useMemo(() => getAttendanceCities(user), [user]);
  const cityKey = cities ? cities.join(",") : "ALL";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openEditForm, setOpenEditForm] = useState({
    status: false,
    details: null,
  });
  const [detailPreview, setDetailPreview] = useState<DetailPreview>(null);

  const fetchData = async () => {
    if (!user.role) return;
    setLoading(true);
    const result = await fetchAttendance(selectedDate, cities);
    setData(result.success && result.data ? result.data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate, user.role, cityKey]);

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">Laporan Absensi</Label>
      <div className="w-full flex justify-center items-start min-h-[80dvh]">
        <DataTable
          columns={getColumns(setOpenEditForm, setDetailPreview)}
          data={data}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          cityOptions={cities ?? STAFF_CITIES}
          exportCities={cities}
          defaultCity={user.location}
        />
      </div>
      {openEditForm.status && (
        <div
          className="fixed w-screen h-screen top-0 left-0 bg-black/50 flex justify-center items-center z-10"
          onClick={() => setOpenEditForm({ status: false, details: null })}
        >
          <AttendanceReportForm
            fetchData={fetchData}
            setOpenEditForm={setOpenEditForm}
            openEditForm={openEditForm}
            selectedDate={selectedDate}
          />
        </div>
      )}
      {loading && <Loading />}
      {detailPreview && (
        <AttendanceDetailPreview
          title={detailPreview.title}
          staffName={detailPreview.staffName}
          photoUrl={detailPreview.photoUrl}
          location={detailPreview.location}
          onClose={() => setDetailPreview(null)}
        />
      )}
    </div>
  );
};

export default Page;

const ClockIcons = ({
  photoUrl,
  location,
  title,
  staffName,
  setDetailPreview,
}: {
  photoUrl?: string;
  location?: AttendanceGeo;
  title: string;
  staffName: string;
  setDetailPreview: Dispatch<SetStateAction<DetailPreview>>;
}) => {
  if (!photoUrl && !location) return null;
  const open = () =>
    setDetailPreview({ title, staffName, photoUrl, location });
  return (
    <div className="flex gap-1">
      {photoUrl && (
        <button
          type="button"
          onClick={open}
          className="text-gray-500 hover:text-gray-800 cursor-pointer"
          title="Lihat foto"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
      )}
      {location && (
        <button
          type="button"
          onClick={open}
          className="text-gray-500 hover:text-gray-800 cursor-pointer"
          title="Lihat lokasi"
        >
          <MapPin className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

const TIME_COLUMNS: { type: AttendanceType; showDate: boolean }[] = [
  { type: "clock_in", showDate: false },
  { type: "clock_out", showDate: true },
  { type: "rest_start", showDate: true },
  { type: "rest_end", showDate: true },
];

const pad = (value: number) => String(value).padStart(2, "0");

const formatAttendanceTime = (value: unknown, showDate: boolean) => {
  if (!(value instanceof Timestamp)) return null;
  const date = value.toDate();
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (!showDate) return time;
  return `${time} (${pad(date.getDate())}/${pad(
    date.getMonth() + 1
  )}/${date.getFullYear()})`;
};

const getColumns = (
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>,
  setDetailPreview: Dispatch<SetStateAction<DetailPreview>>
): ColumnDef<Attendance>[] => [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Cabang",
      accessorKey: "location",
    },
    ...TIME_COLUMNS.map(
      ({ type, showDate }): ColumnDef<Attendance> => ({
        header: ATTENDANCE_LABELS[type],
        accessorKey: type,
        cell: ({ row }) => {
          const attendance = row.original;
          const formatted = formatAttendanceTime(row.getValue(type), showDate);

          if (!formatted) return <div className=""> - </div>;

          return (
            <div className="flex items-center gap-2">
              <span>{formatted}</span>
              <ClockIcons
                photoUrl={attendance[`${type}_photo`]}
                location={attendance[`${type}_location`]}
                title={ATTENDANCE_LABELS[type]}
                staffName={attendance.name}
                setDetailPreview={setDetailPreview}
              />
            </div>
          );
        },
      })
    ),
    {
      id: "actions",
      cell: ({ row }) => {
        const user = userStore((state: any) => state.user);
        if (user.role == "Master") {
          const attendance = row.original;
          return (
            <Pen
              className="text-gray-400 hover:text-gray-600 cursor-pointer h-4"
              onClick={() =>
                setOpenEditForm({ status: true, details: attendance })
              }
            />
          );
        }
        return;
      },
    },
  ];