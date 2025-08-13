"use client";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { BadgeCheck } from "lucide-react";
import LiveCamera from "../live-camera";
import {
  addCash,
  deleteCash,
  updateCash,
} from "@/lib/cash";

interface CashFormProps {
  fetchData: any;
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>;
  openEditForm: { status: boolean; details: any };
  collectionName: string;
}

function CashForm(props: CashFormProps) {
  const [information, setInformation] = useState("");
  const [amount, setAmount] = useState(0);
  const [cashType, setCashType] = useState("income");
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    const details = props.openEditForm?.details;
    const amount = details?.income ? details?.income : details?.expense;
    const type = details?.income ? "income" : "expense";

    if (details) {
      setInformation(details?.information || "");
      setAmount(amount || "");
      setCashType(type || "");
    }
  }, []);

  const onSubmit = async (e: React.FormEvent, actionType: string) => {
    e.preventDefault();

    const details = props.openEditForm?.details;
    if (actionType === "Save") {
      if (!details?.id) {
        const result = await addCash(
          photo ? photo : "",
          props.collectionName,
          cashType,
          amount,
          information
        );
      } else {
        const result = await updateCash(
          props.collectionName,
          details?.id,
          information,
          cashType,
          amount,
          photo ? photo : "",
          details?.income ? "income" : "expense"
        );
      }
    } else if (actionType === "Delete") {
      const result = await deleteCash(props.collectionName, details?.id);
    }

    props.setOpenEditForm({ status: false, details: null });
    props.fetchData();
  };

  return (
    <form
      onClick={(e) => e.stopPropagation()}
      className="w-full sm:w-[400px] bg-white rounded-md p-7 max-h-[90dvh] overflow-y-auto"
    >
      <div className="mb-5 flex justify-between items-end">
        <Label className="text-xl font-semibold">Detail Kas Tunai</Label>
        {props.openEditForm.details && (
          <button
            className="text-red-600 cursor-pointer hover:underline"
            onClick={(e) => onSubmit(e, "Delete")}
          >
            Hapus
          </button>
        )}
      </div>

      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="information">Informasi</Label>
        <Input
          className="w-full text-text"
          value={information}
          onChange={(e) => setInformation(e.target.value)}
          id="information"
          type="text"
        />
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="amount">Nominal</Label>
        <Input
          className="w-full text-text"
          value={amount}
          onChange={(e) => setAmount(e.target.valueAsNumber)}
          id="amount"
          type="number"
        />
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="bankName">Jenis Kas Tunai</Label>
        <div className="flex justify-between gap-3 h-7 w-fit mt-2">
          <span
            className={`flex-1 pl-1 text-sm cursor-pointer ${
              cashType === "income"
                ? "text-green-600 font-semibold rounded-md"
                : "text-gray-600"
            }`}
            onClick={() => setCashType("income")}
          >
            Pemasukan
          </span>
          <Separator orientation="vertical" />
          <span
            className={`flex-1 text-right pr-1 text-sm cursor-pointer ${
              cashType === "expense"
                ? "text-red-600 font-semibold"
                : "text-gray-600"
            }`}
            onClick={() => setCashType("expense")}
          >
            Pengeluaran
          </span>
        </div>
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="amount">Nota</Label>
        {photo ? (
          <img src={photo} alt="" />
        ) : (
          <LiveCamera setPhoto={setPhoto} photo={photo} />
        )}
      </div>

      <div className="w-full mt-1">
        <button
          className="w-full bg-[var(--primary-color)] text-white rounded-md py-1.5 cursor-pointer flex justify-center items-center gap-2"
          onClick={(e) => onSubmit(e, "Save")}
        >
          <BadgeCheck className="size-4" />
          Simpan Tunai
        </button>
      </div>
    </form>
  );
}

export default CashForm;
