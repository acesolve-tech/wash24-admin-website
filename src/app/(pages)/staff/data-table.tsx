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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  setOpenEditForm,
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

  const [locationFilter, setLocationFilter] = useState("Jakarta");

  useEffect(() => {
    table.getColumn("location")?.setFilterValue(locationFilter);
  }, [locationFilter, table]);

  return (
    <div className="flex flex-col justify-start items-start w-full">
      <div className="flex items-center justify-between py-4 gap-4 w-full">
        <div className="flex justify-start items-center w-auto">
          <Input
            placeholder="Cari Karyawan"
            value={(table.getColumn("name")?.getFilterValue() as string) || ""}
            onChange={(e) => {
              table.getColumn("name")?.setFilterValue(e.target.value);
            }}
            className="max-w-sm sm:min-w-80 "
          />
          <ToggleGroup
            type="single"
            value={locationFilter}
            onValueChange={(value) => setLocationFilter(value)}
            className="space-x-2 border ml-2 rounded-md py-1 px-2 h-full"
          >
            <ToggleGroupItem value="Jakarta" className="px-3 h-fit py-1 cursor-pointer">
              Jakarta
            </ToggleGroupItem>
            <ToggleGroupItem value="Surabaya" className="px-3 h-fit py-1 cursor-pointer">
              Surabaya
            </ToggleGroupItem>
            <ToggleGroupItem value="Malang" className="px-3 h-fit py-1 cursor-pointer">
              Malang
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <button 
          className="cursor-pointer ml-auto bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-1.5 rounded-md"
          onClick={() =>
            setOpenEditForm({
              status: true,
              details: null,
            })
          }
        >
          + Tambah Karyawan
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
