"use client";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, Check, X } from "lucide-react";
import {
  addTask,
  clearCompletedTasks,
  fetchTask,
  toggleTask,
  updateOrder,
} from "@/lib/task";
import Loading from "@/components/Loading";
import TaskForm from "@/components/popup/task-form";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [tasks, setTasks] = useState<{ high: any[]; other: any[] }>({
    high: [],
    other: [],
  });
  const [openEditForm, setOpenEditForm] = useState({
    status: false,
    details: null,
  });

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchTask();
    const fetchedData = result.data || { high: [], other: [] };

    const checkedMap: Record<string, boolean> = {};
    [...fetchedData.high, ...fetchedData.other].forEach((item: any) => {
      checkedMap[item.id] = item.status;
    });

    setTasks({ high: fetchedData.high, other: fetchedData.other });
    setCheckedItems(checkedMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleTask = async (id: string, status: boolean) => {
    await toggleTask(id, status);
    fetchData();
  };

  const hanldeClear = async () => {
    await clearCompletedTasks();
    fetchData();
  };

  const handleDragEnd = async (
    activeId: string,
    overId: string | null,
    priority: "high" | "other"
  ) => {
    if (!overId || activeId === overId) return;
    const currentList = [...tasks[priority]];
    const oldIndex = currentList.findIndex((item) => item.id === activeId);
    const newIndex = currentList.findIndex((item) => item.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const newList = arrayMove(currentList, oldIndex, newIndex);
    setTasks((prev) => ({ ...prev, [priority]: newList }));

    const orderedIds = newList.map((item) => item.id);
    await updateOrder(orderedIds);
  };

  const allTasks = [...tasks.high, ...tasks.other];
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status).length;
  const incompleteTasks = totalTasks - completedTasks;

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">List Tugas</Label>
      <div className="w-full flex justify-between items-end">
        <Label className="text-gray-600 font-normal">
          Total: {totalTasks} Tugas ( {completedTasks}
          <Check className="inline size-3 text-green-600" /> {incompleteTasks}
          <X className="inline size-3 text-red-600" />)
        </Label>
        <Label
          className="px-1 text-gray-600 font-normal ml-auto mr-7 hover:text-gray-800 cursor-pointer"
          onClick={hanldeClear}
        >
          Hapus Yang Sudah Selesai
        </Label>
        <div
          onClick={() => setOpenEditForm({ status: true, details: null })}
          className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-1.5 rounded-md text-sm font-medium text-center"
        >
          + Tambah Tugas
        </div>
      </div>
      <div className="flex w-full gap-3">
        <div className="flex flex-col w-1/2 gap-3">
          <div className="flex justify-between items-center">
            <Label className="text-red-500">Prioritas Tinggi</Label>
            <div className="relative self-end">
              <button
                onClick={() => {
                  const text = tasks.high
                    .map(
                      (item) =>
                        `- ${item.title}\n  Description: ${item.description}\n  Note: ${item.note}`
                    )
                    .join("\n\n");

                  navigator.clipboard.writeText(text);
                  setCopied(true);

                  setTimeout(() => setCopied(false), 1500);
                }}
                className="text-sm text-blue-600 cursor-pointer hover:underline py-0"
              >
                Share (Copy All)
              </button>

              {copied && (
                <div className="absolute right-0 -top-[100%] mt-1 px-2 py-1 text-xs rounded bg-black text-white shadow">
                  Copied!
                </div>
              )}
            </div>
          </div>

          <DndContext
            sensors={useSensors(useSensor(PointerSensor))}
            collisionDetection={closestCenter}
            onDragEnd={async (event) => {
              const { active, over } = event;
              await handleDragEnd(
                active.id as string,
                over?.id as string,
                "high"
              );
            }}
          >
            <SortableContext
              items={tasks.high.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.high.map((item) => (
                <SortableItem key={item.id} item={item}>
                  {({ setNodeRef, style, dragHandleProps }) => (
                    <div
                      ref={setNodeRef}
                      style={style}
                      onClick={() =>
                        setOpenEditForm({ status: true, details: item })
                      }
                      className={`hover:bg-accent/50 flex justify-between items-center gap-3 rounded-lg cursor-pointer border p-3 ${
                        checkedItems[item.id] ? "" : "border-gray-400"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={checkedItems[item.id] ?? false}
                            onCheckedChange={(checked) =>
                              handleToggleTask(item.id, !!checked)
                            }
                            className={`peer border size-5 ${
                              checkedItems[item.id]
                                ? "!border-gray-300"
                                : "!border-gray-400"
                            } bg-white data-[state=checked]:!bg-gray-400 data-[state=checked]:text-white`}
                          />
                        </div>
                        <div className="grid gap-1.5 font-normal">
                          <p
                            className={`text-sm leading-none font-medium ${
                              checkedItems[item.id]
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {item?.title}
                          </p>
                          <p
                            className={`text-sm leading-none ${
                              checkedItems[item.id]
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {item?.description}
                          </p>
                          <p
                            className={`text-sm leading-none ${
                              checkedItems[item.id]
                                ? "line-through text-muted-foreground"
                                : "text-gray-700"
                            }`}
                          >
                            Catatan: {item?.note}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        {item?.photo && (
                          <img
                            src={item.photo}
                            alt="Task"
                            className="size-14 object-cover rounded-md border"
                          />
                        )}
                        <div
                          {...dragHandleProps}
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-grab active:cursor-grabbing text-gray-500"
                        >
                          <ArrowUpDown className="size-5" />
                        </div>
                      </div>
                    </div>
                  )}
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Other Priority */}
        <div className="flex flex-col w-1/2 gap-3">
          <Label className="text-yellow-500 my-1">Prioritas Rendah</Label>
          <DndContext
            sensors={useSensors(useSensor(PointerSensor))}
            collisionDetection={closestCenter}
            onDragEnd={async (event) => {
              const { active, over } = event;
              await handleDragEnd(
                active.id as string,
                over?.id as string,
                "other"
              );
            }}
          >
            <SortableContext
              items={tasks.other.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.other.map((item) => (
                <SortableItem key={item.id} item={item}>
                  {({ setNodeRef, style, dragHandleProps }) => (
                    <div
                      ref={setNodeRef}
                      style={style}
                      onClick={() =>
                        setOpenEditForm({ status: true, details: item })
                      }
                      className={`hover:bg-accent/50 flex justify-between items-center gap-3 rounded-lg cursor-pointer border p-3 ${
                        checkedItems[item.id] ? "" : "border-gray-400"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={checkedItems[item.id] ?? false}
                            onCheckedChange={(checked) =>
                              handleToggleTask(item.id, !!checked)
                            }
                            className={`peer border size-5 ${
                              checkedItems[item.id]
                                ? "!border-gray-300"
                                : "!border-gray-400"
                            } bg-white data-[state=checked]:!bg-gray-400 data-[state=checked]:text-white`}
                          />
                        </div>
                        <div className="grid gap-1.5 font-normal">
                          <p
                            className={`text-sm leading-none font-medium ${
                              checkedItems[item.id]
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {item?.title}
                          </p>
                          <p
                            className={`text-sm leading-none ${
                              checkedItems[item.id]
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {item?.description}
                          </p>
                          <p
                            className={`text-sm leading-none ${
                              checkedItems[item.id]
                                ? "line-through text-muted-foreground"
                                : "text-gray-700"
                            }`}
                          >
                            Catatan: {item?.note}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        {item?.photo && (
                          <img
                            src={item.photo}
                            alt="Task"
                            className="size-14 object-cover rounded-md border"
                          />
                        )}
                        <div
                          {...dragHandleProps}
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-grab active:cursor-grabbing text-gray-500"
                        >
                          <ArrowUpDown className="size-5" />
                        </div>
                      </div>
                    </div>
                  )}
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
      {openEditForm.status && (
        <div
          className="fixed w-screen h-screen top-0 left-0 bg-black/50 flex justify-center items-center z-10"
          onClick={() => setOpenEditForm({ status: false, details: null })}
        >
          <TaskForm
            fetchData={fetchData}
            setOpenEditForm={setOpenEditForm}
            openEditForm={openEditForm}
            setLoading={setLoading}
          />
        </div>
      )}
      {loading && <Loading />}
    </div>
  );
};

export default Page;

const SortableItem = ({
  item,
  children,
}: {
  item: any;
  children: (props: {
    setNodeRef: any;
    style: React.CSSProperties;
    dragHandleProps: any;
  }) => React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      {children({
        setNodeRef,
        style,
        dragHandleProps: { ...listeners, ...attributes },
      })}
    </>
  );
};
