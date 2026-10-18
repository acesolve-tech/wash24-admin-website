"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SwitchCamera } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";

interface LiveCameraProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (dataUrl: string) => void;
  title?: string;
}

type FacingMode = "user" | "environment";

const LiveCamera: React.FC<LiveCameraProps> = ({
  open,
  onOpenChange,
  onCapture,
  title = "Ambil Foto",
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    let cancelled = false;
    setError("");

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => { });
        }
      } catch {
        if (!cancelled) {
          setError("Tidak dapat mengakses kamera. Periksa izin browser.");
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, facingMode, stopCamera]);

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current && node.srcObject !== streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(() => { });
    }
  }, []);

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    onCapture(canvas.toDataURL("image/jpeg", 0.9));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[420px] bg-white">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">
          Arahkan kamera ke nota, lalu tekan Ambil Foto.
        </DialogDescription>
        <div className="relative w-full aspect-[4/3] bg-black/80 rounded-md overflow-hidden">
          <video
            ref={setVideoRef}
            autoPlay
            playsInline
            muted
            onLoadedData={() => setReady(true)}
            className="w-full h-full object-cover"
          />
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm text-center px-4">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={flipCamera}
            aria-label="Ganti kamera depan/belakang"
            className="absolute bottom-3 right-3 rounded-full p-2 bg-white/70 hover:bg-white cursor-pointer"
          >
            <SwitchCamera className="size-5" />
          </button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <Button
          type="button"
          onClick={takePhoto}
          disabled={!ready || !!error}
          className="w-full cursor-pointer bg-[var(--primary-color)] hover:bg-[#301094]"
        >
          {ready || error ? "Ambil Foto" : "Menyiapkan kamera..."}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default LiveCamera;