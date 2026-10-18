"use client";
import React, { useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import LiveCamera from "./live-camera";
import { compressImage } from "@/lib/image";

interface PhotoSlotProps {
    label: string;
    value: string | null;
    onChange: (value: string | null) => void;
    disabled?: boolean;
}

const actionClass =
    "w-full flex items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white py-1.5 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

export default function PhotoSlot({
    label,
    value,
    onChange,
    disabled = false,
}: PhotoSlotProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");

    const applyImage = async (source: Blob | string) => {
        setProcessing(true);
        setError("");
        try {
            onChange(await compressImage(source));
        } catch {
            setError("Gambar tidak bisa dibaca. Gunakan format JPG atau PNG.");
        } finally {
            setProcessing(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError("File harus berupa gambar.");
            return;
        }
        applyImage(file);
    };

    const busy = disabled || processing;

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{label}</span>
            <div className="relative w-full aspect-[4/3] rounded-md border border-dashed border-gray-400 bg-gray-50 overflow-hidden flex items-center justify-center">
                {value ? (
                    <>
                        <img src={value} alt={label} className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => onChange(null)}
                            disabled={disabled}
                            aria-label={`Hapus ${label}`}
                            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 cursor-pointer disabled:cursor-not-allowed"
                        >
                            <X className="size-3.5" />
                        </button>
                    </>
                ) : processing ? (
                    <span className="text-xs text-gray-500">Memproses...</span>
                ) : (
                    <div className="flex w-full flex-col gap-1.5 px-2">
                        <button
                            type="button"
                            onClick={() => setCameraOpen(true)}
                            disabled={busy}
                            className={actionClass}
                        >
                            <Camera className="size-3.5" /> Kamera
                        </button>
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={busy}
                            className={actionClass}
                        >
                            <ImagePlus className="size-3.5" /> Galeri
                        </button>
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <input 
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
            <LiveCamera 
                open={cameraOpen}
                onOpenChange={setCameraOpen}
                onCapture={applyImage}
                title={`Ambil ${label}`}
            />
        </div>
    );
}