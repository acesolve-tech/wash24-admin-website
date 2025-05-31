"use client";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  addTask,
  clearCompletedTasks,
  fetchTask,
  toggleTask,
} from "@/lib/task";
import Loading from "@/components/Loading";

const Page = () => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<any>([]);

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchTask();
    const fetchedData = result.data;

    const checkedMap: Record<string, boolean> = {};
    fetchedData?.forEach((item: any) => {
      checkedMap[item.id] = item.status;
    });

    setData(fetchedData);
    setCheckedItems(checkedMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTask = async () => {
    if (!task.trim()) return;
    await addTask(task);
    setTask("");
    fetchData();
    setOpen(false);
  };

  const handleToggleTask = async (id: string, status: boolean) => {
    await toggleTask(id, status);
    fetchData();
  };

  const hanldeClear = async () => {
    await clearCompletedTasks();
    fetchData();
  };

  const totalTasks = data.length;
  const completedTasks = data.filter((t: any) => t.status).length;
  const incompleteTasks = totalTasks - completedTasks;

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">List Tugas</Label>
      <div className="w-full flex justify-between items-end">
        <Label className="px-1 text-gray-600 font-normal">
          Total: {totalTasks} Tugas ( {completedTasks}
          <Check className="inline size-3 text-green-600" /> {incompleteTasks}
          <X className="inline size-3 text-red-600" />)
        </Label>
        <Label
          className="px-1 text-gray-600 font-normal ml-auto mr-10 hover:text-gray-800 cursor-pointer"
          onClick={hanldeClear}
        >
          Hapus Yang Sudah Selesai
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-1.5 rounded-md text-sm font-medium text-center">
              + Tambah Tugas
            </div>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="flex flex-col justify-end items-end gap-3"
          >
            <Input
              id="task"
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Masukan Tugas Baru . . ."
            />
            <button
              className="bg-emerald-700 hover:bg-emerald-800 rounded-md py-1 text-white px-5"
              onClick={() => handleAddTask()}
            >
              Tambahkan Tugas
            </button>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col w-full gap-3">
        {data.map((item: any) => (
          <Label
            key={item.id}
            className={`hover:bg-accent/50 flex items-start gap-3 rounded-lg cursor-pointer border p-3 ${
              checkedItems[item.id] ? "" : "border-gray-400"
            }`}
          >
            <Checkbox
              checked={checkedItems[item.id] ?? false}
              onCheckedChange={(checked) =>
                handleToggleTask(item.id, !!checked)
              }
              className={`peer border ${
                checkedItems[item.id] ? "!border-gray-300" : "!border-gray-400"
              } bg-white data-[state=checked]:!bg-gray-400 data-[state=checked]:text-white`}
            />
            <div className="grid gap-1.5 font-normal">
              <p
                className={`text-sm leading-none  ${
                  checkedItems[item.id]
                    ? "line-through text-muted-foreground"
                    : "font-medium"
                }`}
              >
                {item?.task}
              </p>
            </div>
          </Label>
        ))}
      </div>
      {loading && <Loading />}
    </div>
  );
};

export default Page;
