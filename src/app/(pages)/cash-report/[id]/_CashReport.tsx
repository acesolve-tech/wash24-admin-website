"use client";
import { Label } from "@/components/ui/label";
import { LOCATIONS } from "@/constants";
import { userStore } from "@/store/user";
import { useParams } from "next/navigation";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { ColumnDef } from "@tanstack/react-table";
import { CashReport } from "@/types/cash-report";
import { Timestamp } from "firebase/firestore";
import { Pen, X } from "lucide-react";
import { fetchCashReport, getCashReportPhotos } from "@/lib/cash-report";
import Loading from "@/components/Loading";
import CashReportForm from "@/components/popup/cash-report-form";
import CashReportExportForm from "@/components/popup/cash-report-export-form";

const Page = () => {
  const { id } = useParams();
  const location = LOCATIONS.find((loc) => loc.key === id);
  const title = location?.title || "Kas";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>([]);
  const [total, setTotal] = useState(0);
  const [openEditForm, setOpenEditForm] = useState({
    status: false,
    details: null,
  });
  const [exportForm, setExportForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchCashReport(Array.isArray(id) ? id[0] : id ?? "");
    console.log(result.data?.cashReport);
    setData(result.data?.cashReport);
    setTotal(result.data?.total ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">Laporan Tunai {title}</Label>{" "}
      <DataTable
        columns={getColumns(setOpenEditForm)}
        data={data}
        setOpenEditForm={setOpenEditForm}
        setExportForm={setExportForm}
        total={total}
      />
      {openEditForm.status && (
        <div
          className="fixed w-screen h-screen top-0 left-0 bg-black/50 flex justify-center items-center z-10"
          onClick={() => setOpenEditForm({ status: false, details: null })}
        >
          <CashReportForm
            fetchData={fetchData}
            setOpenEditForm={setOpenEditForm}
            openEditForm={openEditForm}
            collectionName={Array.isArray(id) ? id[0] : id ?? ""}
          />
        </div>
      )}
      {exportForm && (
        <CashReportExportForm
          region={Array.isArray(id) ? id[0] : id ?? ""}
          setExportForm={setExportForm}
        />
      )}
      {loading && <Loading />}
    </div>
  );
};

export default Page;

const NotePhotos = ({ report }: { report: CashReport }) => {
  const photos = getCashReportPhotos(report);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex]);

  if (photos.length === 0) {
    return (
      <div className="w-24 px-1.5 py-1 h-12 border border-dashed border-gray-500 rounded-md text-gray-500 text-xs flex justify-center items-center m-1">
        Tanpa foto
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 pr-5 py-1">
      {photos.map((src, index) => (
        <button
          key={index}
          type="button"
          onClick={() => setActiveIndex(index)}
          aria-label={`Lihat Foto Nota ${index + 1}`}
          className="cursor-pointer"
        >
          <img
            src={src}
            alt={`Foto Nota ${index + 1}`}
            className="w-14 h-12 rounded-md p-0.5 object-cover border border-dashed border-gray-500"
          />
        </button>
      ))}

      {activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto Nota ${activeIndex + 1}`}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/70 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="flex items-center gap-3 text-white text-sm"
            onClick={(event) => event.stopPropagation()}
          >
            {photos.length > 1 &&
              photos.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-pressed={activeIndex === index}
                  className={`rounded-md px-3 py-1 cursor-pointer ${activeIndex === index
                      ? "bg-white text-gray-900"
                      : "bg-white/20 hover:bg-white/30"
                    }`}
                >
                  Foto {index + 1}
                </button>
              ))}
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              aria-label="Tutup"
              className="rounded-full bg-white/20 p-1.5 hover:bg-white/30 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
          <img
            src={photos[activeIndex]}
            alt={`Foto Nota ${activeIndex + 1}`}
            className="max-w-full max-h-[80vh] rounded-lg shadow-lg"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
const getColumns = (
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>
): ColumnDef<CashReport>[] => [
    {
      header: "Tanggal",
      accessorKey: "date",
      cell: ({ row }) => {
        const date = row.getValue("date");

        if (date && date instanceof Timestamp) {
          const { seconds, nanoseconds } = date;
          const milliseconds = seconds * 1000 + nanoseconds / 1000000;
          const formattedDate = new Date(milliseconds);

          const day = formattedDate.getDate();
          const month = formattedDate.getMonth() + 1;
          const year = formattedDate.getFullYear();
          const hours = formattedDate.getHours();
          const minutes = formattedDate.getMinutes();

          const paddedDay = day < 10 ? `0${day}` : `${day}`;
          const paddedMonth = month < 10 ? `0${month}` : `${month}`;
          const paddedHours = hours < 10 ? `0${hours}` : `${hours}`;
          const paddedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;

          const formatted = `${paddedDay}/${paddedMonth}/${year} ${paddedHours}:${paddedMinutes}`;

          return <div className="font-medium">{formatted}</div>;
        } else {
          return <div className="font-medium"> - </div>;
        }
      },
    },
    {
      header: "Informasi",
      accessorKey: "information",
    },
    {
      header: "Nota",
      id: "note",
      cell: ({ row }) => <NotePhotos report={row.original} />,
    },
    {
      header: "Tunai Masuk",
      accessorKey: "income",
      cell: ({ row }) => {
        return (
          <div className="font-medium" style={{ color: "green" }}>
            {(row.getValue("income") as number)?.toLocaleString("id-ID", {
              style: "currency",
              currency: "IDR",
            })}
          </div>
        );
      },
    },
    {
      header: "Tunai Keluar",
      accessorKey: "expense",
      cell: ({ row }) => {
        return (
          <div className="font-medium" style={{ color: "red" }}>
            {(row.getValue("expense") as number)?.toLocaleString("id-ID", {
              style: "currency",
              currency: "IDR",
            })}
          </div>
        );
      },
    },
    {
      header: "Total Tunai",
      accessorKey: "currentTotal",
      cell: ({ row }) => {
        return (
          <div
            className="font-medium"
            style={{
              color:
                (row.getValue("currentTotal") as number) < 0 ? "red" : "green",
            }}
          >
            {(row.getValue("currentTotal") as number)?.toLocaleString("id-ID", {
              style: "currency",
              currency: "IDR",
            })}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = userStore((state: any) => state.user);
        if (user.role == "Master") {
          const cashReport = row.original;
          return (
            <Pen
              className="text-gray-400 hover:text-gray-600 cursor-pointer h-4"
              onClick={() =>
                setOpenEditForm({ status: true, details: cashReport })
              }
            />
          );
        }
        return;
      },
    },
  ];