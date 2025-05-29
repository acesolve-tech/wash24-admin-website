"use client";
import React, { useState, useEffect, SetStateAction, Dispatch } from "react"; 
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { db } from "@/config/firebase";
import {
  BadgeCheck,
  Check,
  ChevronsUpDown,
  Icon,
  Package2,
  PhoneCall,
  Trash,
  Truck,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fetchUsersByRole } from "@/lib/staff";
import {
  addDelivery,
  finishOrCancelDelivery,
  saveDelivery,
} from "@/lib/delivery";
// import { Icon } from "@iconify/react/dist/iconify.js";
// import { ComboboxName } from "../ComboboxName";

interface DeliverFormProps {
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>;
  openEditForm: { status: boolean; details: any };
  regionCollectionName?: string;
  currRole: string;
}

export default function DeliveryForm(props: DeliverFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [driver, setDriver] = useState("");
  const [error, setError] = useState("");
  const formattedPhone = phone.replace(/[^0-9]/g, "");
  const [staffList, setStaffList] = useState<{ uid: string; name: string }[]>(
    []
  );

  const handleAdd = async (e: React.FormEvent, deliveryType: string) => {
    e.preventDefault();
    const data = {
      name: name,
      phone: phone,
      note: note,
      type: deliveryType,
      status: "On Progress",
      position: -1,
    };

    await addDelivery(props.regionCollectionName || "", data);
    setName("");
    setPhone("");
    setNote("");
    props.setOpenEditForm({ status: false, details: null });
  };

  const onSubmit = async (e: React.FormEvent, actionType: string) => {
    e.preventDefault();
    const deliveryId = props.openEditForm?.details?.id;
    if (actionType == "Save") {
      const data = {
        name: name,
        phone: phone,
        note: note,
        driver: driver ? driver : "",
      };
      await saveDelivery(props.regionCollectionName || "", deliveryId, data);
    } else {
      if (actionType === "Finish" && !driver) {
        setError("Harap mengisi nama driver !!");
        return;
      }
      await finishOrCancelDelivery(
        props.regionCollectionName || "",
        deliveryId,
        actionType,
        driver
      );
    }
    props.setOpenEditForm({ status: false, details: null });
  };

  useEffect(() => {
    const loadStaff = async () => {
      const res = await fetchUsersByRole();
      if (res.success && res.data) {
        setStaffList(res.data);
      }
    };
    const fetchData = async () => {
      try {
        const details = props?.openEditForm?.details;
        console.log(details);
        if (details) {
          setName(details.name);
          setPhone(details.phone);
          setNote(details.note);
          setDriver(details.driver);
          console.log(details.driver);
        }
      } catch (error) {
        console.error("Error fetching order data:", error);
      }
    };
    fetchData();
    loadStaff();
  }, [props.openEditForm.details]);

  return (
    <div
      className="fixed w-screen h-screen flex justify-center items-center bg-black/50 top-0 left-0 z-50 sm:p-0 p-5"
      onClick={(e) => {
        props.setOpenEditForm({ status: false, details: null });
      }}
    >
      <div
        className="w-full sm:w-[400px] bg-white rounded-md p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <form className="w-full">
          <div className="flex gap-x-3 justify-between items-center pb-5">
            <Label className="text-2xl font-semibold">Detail Delivery</Label>
            {props.openEditForm?.details?.id && (
              <div className="space-x-3">
                <button
                  title="Delivery Selesai"
                  className="px-3 py-1 border border-green-600 bg-transparent text-green-600 hover:bg-green-100 cursor-pointer rounded-md"
                  onClick={(e) => onSubmit(e, "Finish")}
                >
                  <Check className="size-6" />
                </button>
                {(props.currRole === "Master" ||
                  props.currRole === "Admin") && (
                  <button
                    title="Delivery Cancel"
                    className="px-3 py-1 border border-red-600 bg-transparent text-red-500 hover:bg-red-100 cursor-pointer rounded-md"
                    onClick={(e) => onSubmit(e, "Cancel")}
                  >
                    <Trash className="size-6 scale-75" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            )}
          </div>
          {props.openEditForm.details && (
            <div className="grid w-full items-center gap-1.5 mb-5">
              <Label>Nama Kurir: </Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`w-full justify-between font-normal ${
                      driver ? "text-gray-800" : "text-gray-500"
                    }`}
                  >
                    {driver || "Pilih Karyawan..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="min-w-[340px] w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search staff..." />
                    <CommandList>
                      <CommandEmpty>No staff found.</CommandEmpty>
                      <CommandGroup>
                        {staffList.map((staff) => (
                          <CommandItem
                            key={staff.uid}
                            value={staff.name}
                            onSelect={(currentValue) => {
                              setDriver(
                                currentValue === driver ? "" : currentValue
                              );
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                driver === staff.name
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {staff.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
          <div className="grid w-full items-center gap-1.5 mb-5">
            <Label htmlFor="name">Nama Pelanggan</Label>
            <Input
              className="w-full text-text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              id="name"
              type="name"
              readOnly={props.openEditForm?.details?.id ? true : false}
            />
          </div>
          <div className="grid w-full items-center gap-1.5 mb-5">
            <Label htmlFor="phone">No. Telepon</Label>
            <Input
              className="w-full text-text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              id="phone"
              type="phone"
              readOnly={props.openEditForm?.details?.id ? true : false}
            />
          </div>
          <div className="grid w-full items-center gap-1.5 mb-5">
            <Label htmlFor="note">Catatan</Label>
            <Input
              className="w-full text-text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              id="note"
              type="note"
              readOnly={
                props.openEditForm?.details?.id
                  ? !(props.currRole === "Master" || props.currRole === "Admin")
                  : false
              }
            />
          </div>
          {error.trim() !== "" && (
            <Label className="text-red-500 text-sm px-1 pb-1">{error}</Label>
          )}

          {props.openEditForm.details ? (
            <div className="w-full mt-3">
              {(props.currRole === "Master" || props.currRole === "Admin") && (
                <button
                  className="w-full bg-[var(--primary-color)] hover:bg-[#301094] cursor-pointer py-1.5 rounded-md text-white flex justify-center items-center gap-2"
                  onClick={(e) => onSubmit(e, "Save")}
                >
                  <BadgeCheck className="size-4" />
                  Simpan Order Delivery
                </button>
              )}
              <a
                href={`https://wa.me/${formattedPhone}`}
                className="home-social-icon flex justify-center items-center gap-x-2 mt-3 text-base text-white bg-green-500 hover:bg-green-600 p-1.5 rounded-lg"
                target="_blank"
              >
                <PhoneCall className="size-4" />
                Whatsapp Customer
              </a>
            </div>
          ) : (
            <div className="w-full flex justify-between items-center gap-3 mt-3">
              <button
                className="w-full bg-purple-800 hover:bg-purple-900 cursor-pointer py-1.5 rounded-md text-white flex justify-center items-center gap-2 pr-1"
                onClick={(e) => handleAdd(e, "Deliver")}
              >
                <Truck className="size-4" />
                Antar
              </button>
              <button
                className="w-full bg-[var(--primary-color)] hover:bg-[#301094] cursor-pointer py-1.5 rounded-md text-white flex justify-center items-center gap-2 pr-1"
                onClick={(e) => handleAdd(e, "Pick Up")}
              >
                <Package2 className="size-4" />
                Ambil
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
