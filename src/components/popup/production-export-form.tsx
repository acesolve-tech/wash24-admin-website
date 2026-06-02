import React, { useState } from "react";
import { Label } from "../ui/label";
import { downloadProductionMonthlyToExcel } from "@/lib/production";

interface ProductionExportFormProps {
  setExportForm: (value: boolean) => void;
  region: string;
}

export default function ProductionExportForm(props: ProductionExportFormProps) {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [yearMonth, setYearMonth] = useState(defaultMonth);

  const handleExport = async () => {
    if (!yearMonth) return;
    await downloadProductionMonthlyToExcel(yearMonth, props.region);
    props.setExportForm(false);
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
        <Label className="text-lg font-semibold mb-4">Pilih Bulan & Tahun</Label>
        <form onSubmit={(e) => { e.preventDefault(); handleExport(); }}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Bulan & Tahun</label>
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="w-full border p-2 rounded-md"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-700 hover:bg-purple-800 cursor-pointer text-white rounded-md py-1.5"
          >
            Export ke Excel
          </button>
        </form>
      </div>
    </div>
  );
}
