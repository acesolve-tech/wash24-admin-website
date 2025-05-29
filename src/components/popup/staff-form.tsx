"use client";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Timestamp } from "firebase/firestore";
import { updateAttendance } from "@/lib/attendance";
import { addOrUpdateUser, removeUser } from "@/lib/staff";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface StaffFormProps {
  fetchData: any;
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>;
  openEditForm: { status: boolean; details: any };
}

function StaffForm(props: StaffFormProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [position, setPosition] = useState("");

  useEffect(() => {
    const details = props.openEditForm?.details;

    setName(details?.name || "");
    setLocation(details?.location || "");
    setPhone(details?.phone || "");
    setBankName(details?.bank_name || "");
    setBankAccount(details?.bank_account || "");
    setPosition(details?.position || "");
  }, []);

  const onSubmit = async (e: React.FormEvent, actionType: string) => {
    e.preventDefault();

    if (actionType === "Save") {
      const data = {
        name,
        location,
        phone,
        bank_name: bankName,
        bank_account: bankAccount,
        position,
        role: "Staff",
        updated_at: new Date(),
      };

      const result = await addOrUpdateUser(
        props.openEditForm.details?.uid,
        data
      );
    } else if (actionType === "Delete") {
      const result = await removeUser(props.openEditForm.details?.uid);
    }

    props.setOpenEditForm({ status: false, details: null });
    props.fetchData();
  };

  return (
    <form
      onClick={(e) => e.stopPropagation()}
      className="w-full sm:w-[400px] bg-white rounded-md p-7"
    >
      <div className="mb-5 flex justify-between items-end">
        <Label className="text-xl font-semibold">Detail Karyawan</Label>
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
        <Label htmlFor="name">Name</Label>
        <Input
          className="w-full text-text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          id="name"
          type="name"
        />
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="location">Lokasi</Label>
        <Select
          value={location}
          onValueChange={(value) => {
            console.log(value);
            if(value) {
              setLocation(value)
            }
            // value ?? setLocation(value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih lokasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Surabaya">Surabaya</SelectItem>
            <SelectItem value="Jakarta">Jakarta</SelectItem>
            <SelectItem value="Malang">Malang</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="phone">No. Telepon</Label>
        <Input
          className="w-full text-text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          id="phone"
          type="text"
        />
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="bankName">Nama Bank</Label>
        <Input
          className="w-full text-text"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          id="bankName"
          type="text"
        />
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="bankAccount">No Rek</Label>
        <Input
          className="w-full text-text"
          value={bankAccount}
          onChange={(e) => setBankAccount(e.target.value)}
          id="bankAccount"
          type="text"
        />
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="position">Posisi</Label>
        <Input
          className="w-full text-text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          id="position"
          type="text"
        />
      </div>

      <div className="w-full mt-1">
        <button
          className="w-full bg-[var(--primary-color)] text-white rounded-md py-1.5 cursor-pointer"
          onClick={(e) => onSubmit(e, "Save")}
        >
          Simpan
        </button>
      </div>
    </form>
  );
}

export default StaffForm;
