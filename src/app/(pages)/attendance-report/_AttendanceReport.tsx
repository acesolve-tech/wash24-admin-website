"use client";
import { Label } from "@/components/ui/label";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { Attendance, AttendanceGeo } from "@/types/attendance";
import { ColumnDef } from "@tanstack/react-table";
import { Timestamp } from "firebase/firestore";
import { Camera, MapPin, Pen } from "lucide-react";
import { fetchAttendance } from "@/lib/attendance";
import { userStore } from "@/store/user";
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
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [openEditForm, setOpenEditForm] = useState({
    status: false,
    details: null,
  });
  const [detailPreview, setDetailPreview] = useState<DetailPreview>(null);

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchAttendance(selectedDate);
    setData((result.success && result.data) ?? result.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">Laporan Absensi</Label>
      <div className="w-full flex justify-center items-start min-h-[80dvh]">
        <DataTable
          columns={getColumns(setOpenEditForm, setDetailPreview)}
          data={data}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
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
  {
    header: "Datang Kerja",
    accessorKey: "clock_in",
    cell: ({ row }) => {
      const clock_in = row.getValue("clock_in");
      const attendance = row.original;

      if (clock_in && clock_in instanceof Timestamp) {
        const { seconds, nanoseconds } = clock_in;
        const milliseconds = seconds * 1000 + nanoseconds / 1000000;
        const formattedDate = new Date(milliseconds);

        const options: Intl.DateTimeFormatOptions = {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        };

        const formatter = new Intl.DateTimeFormat("en-US", options);
        const formatted = formatter.format(formattedDate);
        const adjustedFormatted = formatted.replace(/^24/, "00");
        return (
          <div className="flex items-center gap-2">
            <span>{adjustedFormatted}</span>
            <ClockIcons
              photoUrl={attendance.clock_in_photo}
              location={attendance.clock_in_location}
              title="Datang Kerja"
              staffName={attendance.name}
              setDetailPreview={setDetailPreview}
            />
          </div>
        );
      } else {
        return <div className=""> - </div>;
      }
    },
  },
  {
    header: "Pulang Kerja",
    accessorKey: "clock_out",
    cell: ({ row }) => {
      const clock_out = row.getValue("clock_out");
      const attendance = row.original;

      if (clock_out && clock_out instanceof Timestamp) {
        const { seconds, nanoseconds } = clock_out;
        const milliseconds = seconds * 1000 + nanoseconds / 1000000;
        const formattedDate = new Date(milliseconds);

        const options: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        };

        const formatter = new Intl.DateTimeFormat("en-US", options);
        const formatted = formatter.format(formattedDate);

        const dateParts = formatted.split(", ")[0].split("/");
        const adjustedFormatted =
          formatted.split(", ")[1].replace(/^24/, "00") +
          " (" +
          dateParts[1] +
          "/" +
          dateParts[0] +
          "/" +
          dateParts[2] +
          ")";

        return (
          <div className="flex items-center gap-2">
            <span>{adjustedFormatted}</span>
            <ClockIcons
              photoUrl={attendance.clock_out_photo}
              location={attendance.clock_out_location}
              title="Pulang Kerja"
              staffName={attendance.name}
              setDetailPreview={setDetailPreview}
            />
          </div>
        );
      } else {
        return <div className=""> - </div>;
      }
    },
  },
  {
    header: "Istirahat Mulai",
    accessorKey: "rest_start",
    cell: ({ row }) => {
      const clock_out = row.getValue("rest_start");

      if (clock_out && clock_out instanceof Timestamp) {
        const { seconds, nanoseconds } = clock_out;
        const milliseconds = seconds * 1000 + nanoseconds / 1000000;
        const formattedDate = new Date(milliseconds);

        const options: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        };

        const formatter = new Intl.DateTimeFormat("en-US", options);
        const formatted = formatter.format(formattedDate);

        const dateParts = formatted.split(", ")[0].split("/");
        const adjustedFormatted =
          formatted.split(", ")[1].replace(/^24/, "00") +
          " (" +
          dateParts[1] +
          "/" +
          dateParts[0] +
          "/" +
          dateParts[2] +
          ")";

        return <div className="">{adjustedFormatted}</div>;
      } else {
        return <div className=""> - </div>;
      }
    },
  },
  {
    header: "Istirahat Selesai",
    accessorKey: "rest_end",
    cell: ({ row }) => {
      const clock_out = row.getValue("rest_end");

      if (clock_out && clock_out instanceof Timestamp) {
        const { seconds, nanoseconds } = clock_out;
        const milliseconds = seconds * 1000 + nanoseconds / 1000000;
        const formattedDate = new Date(milliseconds);

        const options: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        };

        const formatter = new Intl.DateTimeFormat("en-US", options);
        const formatted = formatter.format(formattedDate);

        const dateParts = formatted.split(", ")[0].split("/");
        const adjustedFormatted =
          formatted.split(", ")[1].replace(/^24/, "00") +
          " (" +
          dateParts[1] +
          "/" +
          dateParts[0] +
          "/" +
          dateParts[2] +
          ")";

        return <div className="">{adjustedFormatted}</div>;
      } else {
        return <div className=""> - </div>;
      }
    },
  },
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
