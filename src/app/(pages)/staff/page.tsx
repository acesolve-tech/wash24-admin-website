"use client";
import { Label } from "@/components/ui/label";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { User } from "@/types/user";
import { ColumnDef } from "@tanstack/react-table";
import { userStore } from "@/store/user";
import { Pen } from "lucide-react";
import { fetchUsersByRole } from "@/lib/staff";
import StaffForm from "@/components/popup/staff-form";
import Loading from "@/components/Loading";

const page = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>([]);
  const [openEditForm, setOpenEditForm] = useState({
    status: false,
    details: null,
  });

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchUsersByRole();
    setData(result.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">List Karyawan</Label>
      <DataTable
        columns={getColumns(setOpenEditForm)}
        data={data}
        setOpenEditForm={setOpenEditForm}
      />
      {openEditForm.status && (
        <div
          className="fixed w-screen h-screen top-0 left-0 bg-black/50 flex justify-center items-center z-10"
          onClick={() => setOpenEditForm({ status: false, details: null })}
        >
          <StaffForm
            fetchData={fetchData}
            setOpenEditForm={setOpenEditForm}
            openEditForm={openEditForm}
          />
        </div>
      )}
      {loading && <Loading />}
    </div>
  );
};

export default page;

const getColumns = (
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>
): ColumnDef<User>[] => [
  {
    header: "Nama",
    accessorKey: "name",
  },
  {
    header: "Cabang",
    accessorKey: "location",
  },
  {
    header: "Posisi",
    accessorKey: "position",
  },
  {
    header: "No. Tlp",
    accessorKey: "phone",
  },
  {
    header: "Nama Bank",
    accessorKey: "bank_name",
  },
  {
    header: "No. Rek",
    accessorKey: "bank_account",
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
