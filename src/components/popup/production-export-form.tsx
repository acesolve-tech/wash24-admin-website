import React, { useState } from "react";
import { Label } from "../ui/label";
import { downloadProductionToExcel } from "@/lib/excel/production";
// import { Button } from "./ui/button";
// import { downloadProductionToExcel } from "@/lib/xlsx-production";

interface ProductionExportFormProps {
  setExportForm: (value: boolean) => void;
  region: string;
}

export default function ProductionExportForm(props: ProductionExportFormProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
    <div
      className="fixed top-0 left-0 w-full h-screen bg-black/50 flex justify-center items-center z-10"
      onClick={() => props.setExportForm(false)}
    >
      <div
        className="w-full sm:w-[400px] bg-white rounded-md p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <Label className="text-lg font-semibold mb-4">
          Pilih Rentang Tanggal
        </Label>
        <form>
          <div className="mb-4">
            <label className="block text-sm font-medium">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border p-2 rounded-md mt-1"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border p-2 rounded-md mt-1"
            />
          </div>
          <button
            className="w-full bg-purple-700 hover:bg-purple-800 cursor-pointer text-white rounded-md py-1.5"
            onClick={() =>
              downloadProductionToExcel(startDate, endDate, props.region)
            }
          >
            Export ke Excel
          </button>
        </form>
      </div>
    </div>
  );
}
