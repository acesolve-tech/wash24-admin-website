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
import { BadgeCheck } from "lucide-react";
import LiveCamera from "../live-camera";
import {
  addCashReport,
  deleteCashReport,
  updateCashReport,
} from "@/lib/cash-report";
import { addTask, deleteTask, updateTask } from "@/lib/task";

interface TaskFormProps {
  fetchData: any;
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>;
  openEditForm: { status: boolean; details: any };
  setLoading: Dispatch<SetStateAction<boolean>>;
}

function TaskForm(props: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [taskType, setTaskType] = useState("");

  useEffect(() => {
    const details = props.openEditForm?.details;

    if (details) {
      setTitle(details?.title || "");
      setDescription(details?.description || "");
      setNote(details?.note || "");
      setPhoto(details?.photo || "");
      setTaskType(details?.taskType || "");
    }
  }, []);

  const onSubmit = async (e: React.FormEvent, actionType: string) => {
    e.preventDefault();
    props.setLoading(true);
    const details = props.openEditForm?.details;
    if (actionType === "Save") {
      if (!title.trim()) return;
      if (!details?.id) {
        await addTask(title, description, note, photo, taskType);
      } else {
        await updateTask(details?.id, {
          title,
          description,
          note,
          photo,
          taskType,
        });
      }
    } else if (actionType === "Delete") {
      await deleteTask(details.id);
    }

    props.setOpenEditForm({ status: false, details: null });
    props.fetchData();
    props.setLoading(false);
  };

  return (
    <form
      onClick={(e) => e.stopPropagation()}
      className="w-full sm:w-[400px] bg-white rounded-md p-7 max-h-[90dvh] overflow-y-auto"
    >
      <div className="mb-5 flex justify-between items-end">
        <Label className="text-xl font-semibold">Detail Tugas</Label>
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
        <Label htmlFor="title">Judul</Label>
        <Input
          className="w-full text-text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          id="title"
          type="text"
        />
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="description">Keterangan</Label>
        <Input
          className="w-full text-text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          id="description"
          type="text"
        />
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="note">Catatan</Label>
        <Input
          className="w-full text-text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          id="note"
          type="text"
        />
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="bankName">Prioritas</Label>
        <div className="flex justify-between gap-3 h-7 w-fit mt-2">
          <span
            className={`flex-1 pl-1 text-sm cursor-pointer text-nowrap ${
              taskType === "high"
                ? "text-red-600 font-semibold rounded-md"
                : "text-gray-600"
            }`}
            onClick={() => setTaskType("high")}
          >
            Prioritas Tinggi
          </span>
          <Separator orientation="vertical" />
          <span
            className={`flex-1 text-right pr-1 text-sm cursor-pointer text-nowrap ${
              taskType === "low"
                ? "text-yellow-600 font-semibold"
                : "text-gray-600"
            }`}
            onClick={() => setTaskType("low")}
          >
            Prioritas Rendah
          </span>
        </div>
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="photo">Gambar</Label>
        {photo && (
          <img
            src={photo}
            alt="Preview"
            className="rounded-md w-full max-h-60 object-cover border"
          />
        )}
        <Input
          id="photo"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                setPhoto(reader.result as string);
              };
              reader.readAsDataURL(file);
            }
          }}
        />
      </div>

      <div className="w-full mt-1">
        <button
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-md py-1.5 cursor-pointer flex justify-center items-center gap-2"
          onClick={(e) => onSubmit(e, "Save")}
        >
          <BadgeCheck className="size-4" />
          Simpan Tugas
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
