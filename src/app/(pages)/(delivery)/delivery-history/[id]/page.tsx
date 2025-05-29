"use client";
import { Label } from "@/components/ui/label";
import { LOCATIONS } from "@/constants";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { fetchDelivery } from "@/lib/delivery";
import Loading from "@/components/Loading";

const page = () => {
  const { id } = useParams();
  const location = LOCATIONS.find((loc) => loc.key === id);
  const title = location?.title || "Unknown Location";
  const collectionName = location?.collectionName;

  const [data, setData] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchDelivery(selectedDate, collectionName || "");
    setData((result.success && result.data) ?? result.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">
        Riawayat Delivery {title}
      </Label>
      <div className="w-full flex justify-center items-start min-h-[80dvh]">
        <DataTable
          columns={columns}
          data={data}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </div>
      {loading && <Loading />}
    </div>
  );
};

export default page;
