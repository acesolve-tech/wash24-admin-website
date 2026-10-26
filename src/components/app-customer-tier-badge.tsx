import { cn } from "@/lib/utils";
import { AppCustomer } from "@/types/app-customer";

export default function AppCustomerTierBadge({ customer }: { customer: AppCustomer }) {
    return (
        <span
            className={cn(
                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                customer.tier === "VIP" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600" 
            )}
        >
            {customer.tier} · {customer.points.toLocaleString("id-ID")} poin
        </span>
    );
}