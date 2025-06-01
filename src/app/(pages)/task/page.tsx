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
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<any>([]);
  const [openEditForm, setOpenEditForm] = useState({
    status: false,
    details: null,
  });

  const fetchData = async () => {
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
      <div className="flex flex-col w-full gap-3">
        {/* {data.map((item: any) => (
          <div
            key={item.id}
            onClick={() => setOpenEditForm({ status: true, details: item })}
            className={`hover:bg-accent/50 flex justify-between items-center gap-3 rounded-lg cursor-pointer border p-3 ${
              checkedItems[item.id] ? "" : "border-gray-400"
            }`}
          >
            <div className="flex justify-start items-start gap-3">
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

            <div className="gap-1.5 font-normal flex justify-center items-center">
              {item?.photo && (
                <img
                  src={item.photo}
                  alt="Task"
                  className="size-14 object-cover rounded-md border"
                />
              )}
            </div>
          </div>
        ))} */}
        <DndContext
          sensors={useSensors(useSensor(PointerSensor))}
          collisionDetection={closestCenter}
          onDragEnd={async (event) => {
            const { active, over } = event;
            if (active.id !== over?.id) {
              const oldIndex = data.findIndex(
                (item: any) => item.id === active.id
              );
              const newIndex = data.findIndex(
                (item: any) => item.id === over?.id
              );
              const newData = arrayMove(data, oldIndex, newIndex);
              setData(newData);
              const orderedIds = newData.map((item: any) => item.id);
              await updateOrder(orderedIds);
            }
          }}
        >
          <SortableContext
            items={data.map((item: any) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {data.map((item: any) => (
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
                      {/* ✅ Drag handle on the RIGHT */}
                      <div
                        {...dragHandleProps}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-grab active:cursor-grabbing text-gray-500"
                      >
                        <ArrowUpDown className="size-5"/>
                      </div>
                    </div>
                  </div>
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
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
