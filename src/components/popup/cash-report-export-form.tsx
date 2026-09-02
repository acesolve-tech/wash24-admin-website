import React, { useState } from "react";
import { Label } from "../ui/label";
import { downloadCashReportRangeToExcel } from "@/lib/excel/cash-report";

interface CashReportExportFormProps {
  setExportForm: (value: boolean) => void;
  region: string;
}

export default function CashReportExportForm(props: CashReportExportFormProps) {
  const today = new Date();
  const iso = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(iso(firstOfMonth));
  const [endDate, setEndDate] = useState(iso(today));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    if (!startDate || !endDate) {
      setError("Silakan pilih tanggal mulai dan tanggal akhir");
      return;
    }
    if (startDate > endDate) {
      setError("Tanggal mulai harus sebelum tanggal akhir");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await downloadCashReportRangeToExcel(startDate, endDate, props.region);
      props.setExportForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed top-0 left-0 w-full h-screen bg-black/50 flex justify-center items-center z-10"
      onClick={() => props.setExportForm(false)}
    >
      <div
        className="w-full sm:w-[400px] bg-white rounded-md p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <Label className="text-lg font-semibold mb-4">Pilih Rentang Tanggal</Label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExport();
          }}
        >
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border p-2 rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border p-2 rounded-md"
            />
          </div>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 cursor-pointer text-white rounded-md py-1.5 disabled:opacity-60"
          >
            {loading ? "Mengunduh..." : "Export ke Excel"}
          </button>
        </form>
      </div>
    </div>
  );
}
