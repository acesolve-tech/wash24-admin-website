"use client";
import { Label } from "@/components/ui/label";
import { LOCATIONS } from "@/constants";
import { userStore } from "@/store/user";
import { useParams } from "next/navigation";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import Loading from "@/components/Loading";
import CashReportForm from "@/components/popup/cash-report-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Timestamp } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";
import { cloneCollection, fetchStock, saveStock } from "@/lib/stock";

const Page = () => {  
  const { id } = useParams();
  const location = LOCATIONS.find((loc) => loc.key === id);
  const title = location?.title || "Unknown Location"; 

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ name: string; stock: number }[]>([]);
  const [backupStockData, setBackupStockData] = useState<typeof data>([]);
  const [lastUpdated, setLastUpdated] = useState<Timestamp | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [openEditForm, setOpenEditForm] = useState({
    status: false,
    details: null,
  });

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchStock(Array.isArray(id) ? id[0] : id ?? "");
    setData(result.data?.stockData ?? []);
    setLastUpdated(result.data?.lastUpdate ?? null);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRow = () => {
    setData((prev) => [...prev, { name: "", stock: 0 }]);
  };

  const handleSave = async () => {
    await saveStock(Array.isArray(id) ? id[0] : id ?? "", data);
    setIsEditing(false);
    fetchData();
  };
  

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">Stok {title}</Label>{" "}
      <div className="flex justify-between items-center py-1 pr-3">
        <h1 className="text-gray-700 px-1">
          Last Updated:{" "}
          {lastUpdated ? new Date(lastUpdated.toDate()).toLocaleString() : "-"}
        </h1>
        {!isEditing ? (
          <button
            className="text-base text-blue-600 rounded-md cursor-pointer"
            onClick={() => {
              setBackupStockData(data?.map((item) => ({ ...item })));
              setIsEditing(true);
            }}
          >
            Edit Stok
          </button>
        ) : (
          <button
            className="text-base text-red-600 rounded-md cursor-pointer"
            onClick={() => {
              setData(backupStockData);
              setIsEditing(false);
            }}
          >
            Cancel Edit
          </button>
        )}
      </div>
      <button onClick={() => cloneCollection("cash-report-sby-2", "cash-report-sby2")}>
        Clone
      </button>
      <div className="w-full rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">No.</TableHead>
              <TableHead>Nama Barang</TableHead>
              <TableHead className="">Stok</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((item: any, index: number) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const updatedData = [...data];
                        updatedData[index].name = e.target.value;
                        setData(updatedData);
                      }}
                      className="w-full"
                    />
                  ) : (
                    item.name
                  )}
                </TableCell>
                <TableCell className="">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={item.stock}
                      onChange={(e) => {
                        const updatedData = [...data];
                        updatedData[index].stock = parseFloat(e.target.value);
                        setData(updatedData);
                      }}
                      className="w-24 text-right"
                    />
                  ) : (
                    item.stock.toFixed(2)
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {isEditing && (
        <div className="flex justify-between gap-5 items-center">
          <button
            onClick={handleAddRow}
            className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-1.5 rounded-md"
          >
            + Tambah Stok
          </button>
          <button
            className="cursor-pointer bg-purple-700 hover:bg-purple-800 text-white px-5 py-1.5 rounded-md flex justify-center items-center gap-1"
            onClick={handleSave}
          >
            <BadgeCheck className="size-4" /> Simpan Stok
          </button>
        </div>
      )}
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
