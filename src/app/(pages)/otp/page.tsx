"use client";
import Loading from "@/components/Loading";
import { Label } from "@/components/ui/label";
import { clearOldOtps, fetchAllOtp } from "@/lib/otp";
import { Timestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";

const page = () => {
  const [otps, setOtps] = useState<any>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchAllOtp();
    setOtps(result.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp || !timestamp.toDate) return null;
    const date = timestamp.toDate();
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear().toString().slice(-2)} - ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
  };

  const handleClearOtp = async () => {
    setLoading(true);
    const result = await clearOldOtps();
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">List OTP</Label>
      <div className="w-full flex flex-col justify-start items-start min-h-[80dvh]">
        <div className="flex justify-end items-center px-1 w-full gap-10 mb-6">
          <button
            onClick={handleClearOtp}
            className="text-gray-500 hover:text-red-600 cursor-pointer text-sm"
          >
            Hapus OTP Lama
          </button>
          <button onClick={fetchData} className="text-gray-500 hover:text-blue-600 cursor-pointer text-sm">
            Refresh OTP
          </button>
        </div>
        <div className="flex flex-wrap justify-start items-start w-full gap-5">
          {otps?.map((otp: any, index: number) => (
            <div
              className="shadow-md p-4 rounded-md border min-w-[310px]"
              key={index}
            >
              <h3 className="text-gray-600 text-xs flex justify-between items-center mb-1">
                <span>Tanggal:</span>
                <span>{formatTimestamp(otp.createdAt)}</span>
              </h3>
              <h1 className="text-gray-800 text-xl flex justify-between items-center">
                <span className="text-gray-700">OTP:</span>
                <span className="font-semibold">{otp?.otp}</span>
              </h1>
              <h4 className="text-gray-600 text-sm flex justify-between items-center">
                <span>Email:</span>
                <span>{otp?.email}</span>
              </h4>
            </div>
          ))}
        </div>
      </div>
      {loading && <Loading />}
    </div>
  );
};

export default page;
