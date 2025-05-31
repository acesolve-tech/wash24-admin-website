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
import { Pen } from "lucide-react";
import { fetchCashReport } from "@/lib/cash-report";
import Loading from "@/components/Loading";
import CashReportForm from "@/components/popup/cash-report-form";

const Page = () => {
  const { id } = useParams();
  const location = LOCATIONS.find((loc) => loc.key === id);
  const title = location?.title || "Unknown Location";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>([]);
  const [total, setTotal] = useState(0);
  const [openEditForm, setOpenEditForm] = useState({
    status: false,
    details: null,
  });

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
      {loading && <Loading />}
    </div>
  );
};

export default Page;
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

        // Pad single-digit day and month with leading zero
        const paddedDay = day < 10 ? `0${day}` : `${day}`;
        const paddedMonth = month < 10 ? `0${month}` : `${month}`;

        const formatted = `${paddedDay}/${paddedMonth}/${year}`;

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
    accessorKey: "note",
    cell: ({ row }) => {
      const [isModalOpen, setModalOpen] = React.useState(false);
      const noteValue = row?.getValue("note")
        ? (row.getValue("note") as string)
        : "";

      return (
        <div className="pr-5">
          {noteValue ? (
            <img
              src={noteValue}
              alt="note"
              className="w-full h-12 rounded-md p-1 object-cover border border-dashed border-gray-500 cursor-pointer m-1"
              onClick={() => setModalOpen(true)}
            />
          ) : (
            <div className="w-full px-1.5 py-1 h-12 border border-dashed border-gray-500 rounded-md text-gray-500 text-xs flex justify-center items-center cursor-pointer m-1">
              No Image
            </div>
          )}

          {isModalOpen && (
            <div
              className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
              onClick={() => setModalOpen(false)}
            >
              <img
                src={noteValue}
                alt="Full-size note"
                className="max-w-full max-h-full rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>
      );
    },
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
