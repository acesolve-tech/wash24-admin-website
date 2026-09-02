"use client";
import React, { useEffect, useState } from "react";
import { ExternalLink, MapPin, X } from "lucide-react";
import { AttendanceGeo } from "@/types/attendance";
import { Label } from "../ui/label";

interface Props {
  title: string;
  staffName: string;
  photoUrl?: string;
  location?: AttendanceGeo;
  onClose: () => void;
}

export default function AttendanceDetailPreview({
  title,
  staffName,
  photoUrl,
  location,
  onClose,
}: Props) {
  const [address, setAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;
    let cancelled = false;
    setAddressLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.lat}&lon=${location.lng}&zoom=16&addressdetails=1`,
          { headers: { "Accept-Language": "id" } }
        );
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (cancelled) return;
        setAddress(data.display_name || null);
      } catch {
        if (cancelled) return;
        setAddressError("Gagal memuat alamat.");
      } finally {
        if (!cancelled) setAddressLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location?.lat, location?.lng]);

  const embedSrc = location
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${
        location.lng - 0.004
      },${location.lat - 0.004},${location.lng + 0.004},${
        location.lat + 0.004
      }&layer=mapnik&marker=${location.lat},${location.lng}`
    : null;

  const gmapsUrl = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : null;

  return (
    <div
      className="fixed w-full h-full flex justify-center items-center bg-black/60 px-2 z-50 top-0 left-0"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[520px] bg-white rounded-md p-5 flex flex-col gap-y-3 max-h-[95vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xl font-semibold block">{title}</Label>
            <span className="text-sm text-gray-500">{staffName}</span>
          </div>
          <button
            className="hover:bg-black/10 rounded-full p-1.5 cursor-pointer"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {photoUrl && (
          <div className="flex flex-col gap-1">
            <Label className="text-sm">Foto</Label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={`Foto ${title}`}
              className="w-full rounded-md border object-cover max-h-[360px]"
            />
          </div>
        )}
        {!photoUrl && (
          <div className="text-sm text-gray-500 italic">
            Foto tidak tersedia.
          </div>
        )}

        {location && (
          <div className="flex flex-col gap-2">
            <Label className="text-sm">Lokasi</Label>
            <div className="flex items-start gap-2 rounded-md border p-2 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 text-gray-600 shrink-0" />
              <div className="flex-1">
                {addressLoading && (
                  <span className="text-gray-500">Memuat alamat...</span>
                )}
                {!addressLoading && address && (
                  <span className="text-gray-800">{address}</span>
                )}
                {!addressLoading && !address && !addressError && (
                  <span className="text-gray-500">Alamat tidak ditemukan.</span>
                )}
                {addressError && (
                  <span className="text-red-600">{addressError}</span>
                )}
                <div className="text-xs text-gray-500 mt-0.5">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  {location.accuracy != null &&
                    ` (± ${Math.round(location.accuracy)} m)`}
                </div>
              </div>
            </div>
            {embedSrc && (
              <iframe
                title={`Peta ${title}`}
                className="w-full h-[260px] rounded-md border"
                src={embedSrc}
                loading="lazy"
              />
            )}
            {gmapsUrl && (
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[var(--primary-color)] inline-flex items-center gap-1 self-start hover:underline"
              >
                Buka di Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
        {!location && (
          <div className="text-sm text-gray-500 italic">
            Lokasi tidak tersedia.
          </div>
        )}
      </div>
    </div>
  );
}
