import type { IconType } from "react-icons";
import {
    IoBagHandleOutline,
    IoBasketOutline,
    IoBedOutline,
    IoBriefcaseOutline,
    IoCubeOutline,
    IoFlameOutline,
    IoFootstepsOutline,
    IoLayersOutline,
    IoShirtOutline,
    IoSnowOutline,
    IoSparklesOutline,
    IoWaterOutline,
} from "react-icons/io5";
import { cn } from "@/lib/utils";

export const APP_SERVICE_ICON_OPTIONS: { name: string; label: string; Icon: IconType }[] = [
    { name: "shirt-outline", label: "Baju", Icon: IoShirtOutline },
    { name: "water-outline", label: "Air", Icon: IoWaterOutline },
    { name: "flame-outline", label: "Setrika", Icon: IoFlameOutline },
    { name: "sparkles-outline", label: "Bersih", Icon: IoSparklesOutline },
    { name: "snow-outline", label: "Dry clean", Icon: IoSnowOutline },
    { name: "footsteps-outline", label: "Sepatu", Icon: IoFootstepsOutline },
    { name: "bag-handle-outline", label: "Tas", Icon: IoBagHandleOutline },
    { name: "briefcase-outline", label: "Koper", Icon: IoBriefcaseOutline },
    { name: "layers-outline", label: "Karpet", Icon: IoLayersOutline },
    { name: "bed-outline", label: "Bed cover", Icon: IoBedOutline },
    { name: "basket-outline", label: "Keranjang", Icon: IoBasketOutline },
    { name: "cube-outline", label: "Lainnya", Icon: IoCubeOutline },
];

const ICONS: Record<string, IconType> = Object.fromEntries(
    APP_SERVICE_ICON_OPTIONS.map(({ name, Icon }) => [name, Icon])
);

export default function AppServiceIcon({
    name,
    className,
}: {
    name: string;
    className?: string;
}) {
    const Icon = ICONS[name] ?? IoCubeOutline;
    return (
        <span
            aria-hidden
            className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-[#303094]/10 text-[var(--primary-color)]",
                className
            )}
        >
            <Icon className="size-[55%]" />
        </span>
    );
}