"use client";
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { 
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "./ui/command";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { AppCustomer } from "@/types/app-customer";

interface AppCustomerPickerProps {
    id?: string;
    customers: AppCustomer[];
    value: string;
    onChange: (phone: string) => void;
    disabled?: boolean;
}

export default function AppCustomerPicker({
    id,
    customers,
    value,
    onChange,
    disabled,
}: AppCustomerPickerProps) {
    const [open, setOpen] = useState(false);
    const selected = customers.find((customer) => customer.phone === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between font-normal",
                        selected ? "text-gray-900" : "text-gray-500"
                    )}
                >
                    <span className="truncate">
                        {selected
                            ? `${selected.name || "(tanpa nama)"} · ${formatPhoneDisplay(selected.phone)}`
                            : "Pilih customer..."}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Cari nama atau nomor HP..." />
                    <CommandList>
                        <CommandEmpty>Customer tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {customers.map((customer) => {
                                const digits = customer.phone.replace(/\D/g, "");
                                return (
                                    <CommandItem
                                        key={customer.phone}
                                        value={`${customer.name}__${customer.phone}`}
                                        keywords={[customer.name, digits, "0" + digits.slice(2)]}
                                        onSelect={() => {
                                            onChange(customer.phone);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check 
                                            className={cn(
                                                "mr-2 size-4",
                                                customer.phone === value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate">{customer.name || "(tanpa nama)"}</p>
                                            <p className="text-xs text-gray-500">{formatPhoneDisplay(customer.phone)}</p>
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}