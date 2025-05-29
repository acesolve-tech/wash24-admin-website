"use client";

import DragNDropList from "@/components/drag-and-drop-delivery";
import Loading from "@/components/Loading";
import DeliveryForm from "@/components/popup/delivery-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LOCATIONS } from "@/constants";
import { userStore } from "@/store/user";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useState } from "react";

const Page = () => {
  const user = userStore((state: any) => state.user);

  const { id } = useParams();
  const location = LOCATIONS.find((loc) => loc.key === id);
  const title = location?.title || "Unknown Location";
  const collectionName = location?.collectionName;

  const [loading, setLoading] = useState(true);
  const [openEditForm, setOpenEditForm] = useState({
    status: false,
    details: null,
  });

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto">
      <Label className="text-3xl font-bold w-fit mb-6">Delivery {title}</Label>
      <div className="w-full flex justify-end items-center gap-5">
        <Link
          href={`/delivery-history/${id}`}
          className="cursor-pointer bg-yellow-700 hover:bg-yellow-800 text-white px-5 py-2 rounded-md"
        >
          History Order Delivery
        </Link>
        <button
          className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-md"
          onClick={(e) => {
            setOpenEditForm({ status: true, details: null });
          }}
        >
          + Tambah Order Delivery
        </button>
      </div>
      <div className="w-full flex flex-col justify-start items-start min-h-[80dvh]">
        <DragNDropList
          regionCollectionName={collectionName}
          setLoading={setLoading}
          setOpenEditForm={setOpenEditForm}
          currRole={user.role}
        />
      </div>
      {openEditForm.status && (
        <DeliveryForm
          regionCollectionName={collectionName}
          setOpenEditForm={setOpenEditForm}
          openEditForm={openEditForm}
          currRole={user.role}
        />
      )}
      {loading && <Loading />}
    </div>
  );
};

export default Page;
