"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Dispatch, SetStateAction, useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { downloadDeliveryToExcel } from "@/lib/excel/delivery";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  selectedDate: Date;
  setSelectedDate: Dispatch<SetStateAction<Date>>;
  collectionName: string | undefined;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  selectedDate,
  setSelectedDate,
  collectionName,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  return (
    <div className="flex flex-col justify-start items-start w-full">
      <div className="w-full flex justify-between items-center">
        <div className="flex items-center py-4 gap-4 w-full">
          <Input
            placeholder="Cari Karyawan"
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm min-w-[300px]"
          />
          <DatePicker
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>
        <button
          className="cursor-pointer ml-auto bg-purple-700 hover:bg-purple-800 text-white px-5 py-1.5 rounded-md text-nowrap"
          onClick={() =>
            downloadDeliveryToExcel(
              selectedDate?.getFullYear(),
              selectedDate?.getMonth() + 1,
              collectionName
            )
          }
        >
          + Export ke Excel
        </button>
      </div>
      <div className="rounded-md border w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
