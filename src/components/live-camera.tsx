"use client";
import React, {
  useState,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { SwitchCamera } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";

interface LiveCameraProps {
  photo: string | null;
  setPhoto: Dispatch<SetStateAction<string | null>>;
}

const LiveCamera: React.FC<LiveCameraProps> = ({ photo, setPhoto }) => {
  const [open, setOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // Canvas reference

  useEffect(() => {
    if (open) {
      startCamera();
      setPhoto(null);
    } else {
      stopCamera();
    }
  }, [open]);

  const flipCamera = () => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setTimeout(() => startCamera(), 100);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const ctx = canvasRef.current.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);

      const imageData = canvasRef.current.toDataURL("image/png");
      console.log(imageData);
      setPhoto(imageData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <svg
            fill="#6B7280"
            height="20px"
            width="20px"
            viewBox="0 0 487 487"
            stroke="#6B7280"
          >
            <g>
              <path d="M308.1,277.95c0,35.7-28.9,64.6-64.6,64.6s-64.6-28.9-64.6-64.6s28.9-64.6,64.6-64.6S308.1,242.25,308.1,277.95z M440.3,116.05c25.8,0,46.7,20.9,46.7,46.7v122.4v103.8c0,27.5-22.3,49.8-49.8,49.8H49.8c-27.5,0-49.8-22.3-49.8-49.8v-103.9 v-122.3l0,0c0-25.8,20.9-46.7,46.7-46.7h93.4l4.4-18.6c6.7-28.8,32.4-49.2,62-49.2h74.1c29.6,0,55.3,20.4,62,49.2l4.3,18.6H440.3z M97.4,183.45c0-12.9-10.5-23.4-23.4-23.4c-13,0-23.5,10.5-23.5,23.4s10.5,23.4,23.4,23.4C86.9,206.95,97.4,196.45,97.4,183.45z M358.7,277.95c0-63.6-51.6-115.2-115.2-115.2s-115.2,51.6-115.2,115.2s51.6,115.2,115.2,115.2S358.7,341.55,358.7,277.95z"></path>
            </g>
          </svg>
          <span>Buka Kamera</span>
        </Button>
      </DialogTrigger>
      <DialogTitle className="sr-only">Buka Kamera</DialogTitle>
      <DialogContent className="w-full sm:w-[400px] bg-white rounded-md">
        {photo ? (
          <div className="">
            <h3>Foto Tertangkap:</h3>
            <img
              src={photo}
              alt="Captured"
              className="mt-2 w-full rounded-lg"
            />
          </div>
        ) : (
          <div className="relative w-full">
            <h3 className="mb-3">Camera:</h3>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div
              className="absolute bottom-3 right-3 rounded-full p-2 bg-white/50 cursor-pointer hover:bg-white"
              onClick={flipCamera}
            >
              <SwitchCamera />
            </div>
          </div>
        )}
        <div className="mt-4 flex gap-4">
          {!photo ? (
            <Button onClick={takePhoto} className="w-full">
              Ambil Foto
            </Button>
          ) : (
            <Button onClick={() => setOpen(false)} className="w-full">
              Tutup Kamera
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveCamera;
