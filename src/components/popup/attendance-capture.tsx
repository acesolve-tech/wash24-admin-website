"use client";
import React, { useEffect, useRef, useState } from "react";
import { Label } from "../ui/label";
import { Camera, MapPin, RefreshCw, X } from "lucide-react";
import { AttendanceGeo, AttendanceType } from "@/types/attendance";
import { ATTENDANCE_LABELS } from "@/constants/attendance";

interface AttendanceCaptureProps {
  staffName: string;
  attendanceType: AttendanceType;
  onCancel: () => void;
  onConfirm: (payload: {
    photo: string;
    location: AttendanceGeo;
  }) => Promise<void> | void;
}

export default function AttendanceCapture({
  staffName,
  attendanceType,
  onCancel,
  onConfirm,
}: AttendanceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [location, setLocation] = useState<AttendanceGeo | null>(null);
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "locating" | "ready" | "error"
  >("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [address, setAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => { });
        };
      }
    } catch {
      setCameraError(
        "Tidak dapat mengakses kamera. Periksa izin browser."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const requestGps = () => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("error");
      setGpsError("Perangkat tidak mendukung GPS.");
      return;
    }
    setGpsStatus("locating");
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        });
        setGpsStatus("ready");
      },
      (err) => {
        setGpsStatus("error");
        setGpsError(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Aktifkan izin lokasi untuk melanjutkan."
            : "Gagal mendapatkan lokasi GPS."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    startCamera();
    requestGps();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!location) {
      setAddress(null);
      return;
    }
    let cancelled = false;
    setAddressLoading(true);
    setAddress(null);
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
        setAddress(null);
      } finally {
        if (!cancelled) setAddressLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location?.lat, location?.lng]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPhoto(dataUrl);
    stopCamera();
  };

  const retake = async () => {
    setPhoto(null);
    await startCamera();
  };

  const handleConfirm = async () => {
    if (!photo || !location || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm({ photo, location });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!photo && !!location && !submitting;
  const label = ATTENDANCE_LABELS[attendanceType];

  const handleCancel = () => {
    if (submitting) return;
    onCancel();
  };

  return (
    <div
      className="fixed w-full h-full flex justify-center items-center bg-black/60 px-2 z-50 top-0 left-0"
      onClick={handleCancel}
    >
      <div
        className="w-full sm:w-[420px] bg-white rounded-md p-5 flex flex-col gap-y-4 max-h-[95vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <Label className="text-xl font-semibold">Absensi {label}</Label>
          <button
            type="button"
            aria-label="Tutup"
            className="hover:bg-black/10 rounded-full p-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleCancel}
            disabled={submitting}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-sm text-gray-700">
          <span className="text-gray-500">Karyawan: </span>
          <span className="font-medium">{staffName}</span>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">Foto Karyawan</Label>
          <div className="relative w-full aspect-[4/3] bg-black/80 rounded-md overflow-hidden flex justify-center items-center">
            {!photo && (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
            )}
            {photo && (
              <img
                src={photo}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}
            {cameraError && !photo && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm text-center px-4">
                {cameraError}
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex gap-2">
            {!photo && (
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!!cameraError}
                className={`flex-1 rounded-md py-1.5 text-white flex items-center justify-center gap-2 ${cameraError
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[var(--primary-color)] cursor-pointer"
                  }`}
              >
                <Camera className="w-4 h-4" /> Ambil Foto
              </button>
            )}
            {photo && (
              <button
                type="button"
                onClick={retake}
                className="flex-1 rounded-md py-1.5 text-gray-700 border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Ambil Ulang
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">Lokasi GPS</Label>
          <div className="flex items-start gap-2 rounded-md border p-2 text-sm">
            <MapPin
              className={`w-4 h-4 mt-0.5 shrink-0 ${gpsStatus === "ready"
                  ? "text-green-600"
                  : gpsStatus === "error"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
            />
            <div className="flex-1">
              {gpsStatus === "locating" && (
                <span className="text-gray-600">Mencari lokasi...</span>
              )}
              {gpsStatus === "ready" && location && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-gray-800">
                    {addressLoading && "Memuat alamat..."}
                    {!addressLoading && address}
                    {!addressLoading && !address && "Alamat tidak ditemukan."}
                  </span>
                  <span className="text-xs text-gray-500">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    {location.accuracy != null &&
                      ` (± ${Math.round(location.accuracy)} m)`}
                  </span>
                </div>
              )}
              {gpsStatus === "error" && (
                <span className="text-red-600">{gpsError}</span>
              )}
              {gpsStatus === "idle" && (
                <span className="text-gray-500">Menunggu izin...</span>
              )}
            </div>
            {gpsStatus !== "ready" && (
              <button
                type="button"
                onClick={requestGps}
                className="text-xs text-[var(--primary-color)] underline cursor-pointer"
              >
                Coba lagi
              </button>
            )}
          </div>
          {gpsStatus === "ready" && location && (
            <iframe
              title="Peta Lokasi"
              className="w-full h-[200px] rounded-md border"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.004
                },${location.lat - 0.004},${location.lng + 0.004},${location.lat + 0.004
                }&layer=mapnik&marker=${location.lat},${location.lng}`}
              loading="lazy"
            />
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canSubmit}
          className={`w-full rounded-md py-2 text-white ${canSubmit
              ? "bg-[var(--primary-color)] cursor-pointer"
              : "bg-gray-400 cursor-not-allowed"
            }`}
        >
          {submitting ? "Menyimpan..." : `Konfirmasi ${label}`}
        </button>
      </div>
    </div>
  );
}