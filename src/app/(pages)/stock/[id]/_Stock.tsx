"use client";
import { Label } from "@/components/ui/label";
import { LOCATIONS } from "@/constants";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Loading from "@/components/Loading";
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
import { BadgeCheck } from "lucide-react";
import { fetchStock, fetchStockLogs, saveStock } from "@/lib/stock";
import { formatTimestampShort } from "@/lib/utils";

const Page = () => {
  const { id } = useParams();
  const location = LOCATIONS.find((loc) => loc.key === id);
  const title = location?.title || "Unknown Location";

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [data, setData] = useState<
    {
      id: string;
      name: string;
      stokAwal: number;
      barangMasuk: number;
      barangKeluar: number;
      lastUpdated: Timestamp | null;
    }[]
  >([]);
  const [backupStockData, setBackupStockData] = useState<typeof data>([]);
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchStock(Array.isArray(id) ? id[0] : id ?? "");
    setData(result.data);
    setBackupStockData(result.data);

    const logResult = await fetchStockLogs(
      Array.isArray(id) ? id[0] : id ?? ""
    );
    setLogs(logResult.data);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRow = () => {
    setData((prev) => [
      ...prev,
      {
        id: "",
        name: "",
        stokAwal: 0,
        barangMasuk: 0,
        barangKeluar: 0,
        lastUpdated: null,
      },
    ]);
  };

  const handleSave = async () => {
    await saveStock(
      Array.isArray(id) ? id[0] : id ?? "",
      data,
      backupStockData
    );
    setIsEditing(false);
    fetchData();
  };

  const renderValue = (value: any) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    }
    return String(value);
  };

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">Stok {title}</Label>
      <div className="flex justify-end items-center py-1 pr-3">
        {!isEditing ? (
          <button
            className="text-base text-blue-600 cursor-pointer"
            onClick={() => {
              setBackupStockData(data?.map((item) => ({ ...item })));
              setIsEditing(true);
            }}
          >
            Edit Stok
          </button>
        ) : (
          <button
            className="text-base text-red-600 cursor-pointer"
            onClick={() => {
              setData(backupStockData);
              setIsEditing(false);
            }}
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="w-full rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">No.</TableHead>
              <TableHead>Nama Barang</TableHead>
              <TableHead className="">Stok Awal</TableHead>
              <TableHead>Barang Masuk</TableHead>
              <TableHead>Barang Keluar</TableHead>
              <TableHead>Stok Akhir</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data?.map((item, index) => (
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
                    />
                  ) : (
                    item.name
                  )}
                </TableCell>

                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={item.stokAwal}
                      onChange={(e) => {
                        const updatedData = [...data];
                        updatedData[index].stokAwal = parseFloat(
                          e.target.value
                        );
                        setData(updatedData);
                      }}
                      className="w-24 text-right"
                    />
                  ) : (
                    <span>{item.stokAwal}</span>
                  )}
                </TableCell>

                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={item.barangMasuk}
                      onChange={(e) => {
                        const updatedData = [...data];
                        updatedData[index].barangMasuk = parseFloat(
                          e.target.value
                        );
                        setData(updatedData);
                      }}
                      className="w-24 text-right"
                    />
                  ) : (
                    <span>{item.barangMasuk}</span>
                  )}
                </TableCell>

                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={item.barangKeluar}
                      onChange={(e) => {
                        const updatedData = [...data];
                        updatedData[index].barangKeluar = parseFloat(
                          e.target.value
                        );
                        setData(updatedData);
                      }}
                      className="w-24 text-right"
                    />
                  ) : (
                    <span>{item.barangKeluar}</span>
                  )}
                </TableCell>
                <TableCell>
                  {!isEditing && (
                    <span>
                      {item.stokAwal + item.barangMasuk - item.barangKeluar}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isEditing && (
        <div className="flex justify-between items-center">
          <button
            onClick={handleAddRow}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-1.5 rounded-md"
          >
            + Tambah Stok
          </button>

          <button
            onClick={handleSave}
            className="bg-purple-700 hover:bg-purple-800 text-white px-5 py-1.5 rounded-md flex items-center gap-1"
          >
            <BadgeCheck className="size-4" /> Simpan Stok
          </button>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-xl font-bold mb-3">History Log</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Old</TableHead>
              <TableHead>New</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-4 text-gray-500"
                >
                  No history yet.
                </TableCell>
              </TableRow>
            )}

            {logs.map((log, index) => (
              <TableRow key={index}>
                <TableCell>
                  {log.timestamp ? formatTimestampShort(log.timestamp) : "-"}
                </TableCell>

                <TableCell>{log.itemName ?? "-"}</TableCell>
                <TableCell className="capitalize">{log.field}</TableCell>

                {/* FIXED: Safe rendering */}
                <TableCell>{renderValue(log.oldValue)}</TableCell>
                <TableCell>{renderValue(log.newValue)}</TableCell>

                <TableCell>{log.updatedBy ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {loading && <Loading />}
    </div>
  );
};

export default Page;
