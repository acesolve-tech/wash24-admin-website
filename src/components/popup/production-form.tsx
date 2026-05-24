"use client";
import React, {
  useState,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/config/firebase";
import { Camera, Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { fetchUsersByRole } from "@/lib/staff";

interface ProductionFormProps {
  fetchData: any;
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>;
  openEditForm: { status: boolean; details: any };
  region: string;
  categoryToEdit: string;
}

export default function ProductionForm(props: ProductionFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imageSrcList, setImageSrcList] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(false);

  const [staffSelectedByOption, setStaffSelectedByOption] = useState<{
    [key: string]: string;
  }>({});
  const [openStaffForOption, setOpenStaffForOption] = useState<{
    [key: string]: boolean;
  }>({});

  const [staffList, setStaffList] = useState<{ uid: string; name: string }[]>(
    []
  );
  const options = ["pickup", "nota", "cuci", "kering", "setrika", "lipat", "packing", "delivery"];

  useEffect(() => {
    const fetchProductionData = async () => {
      if (props.openEditForm?.details?.id) {
        const docRef = doc(
          db,
          `productions-${props.region}`,
          props.openEditForm?.details?.id
        );
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log(data);
            setCustomerName(data.customer_name || "");

            const staffData = data.production_staff || {};
            const preFilledStaff: { [key: string]: string } = {};

            options.forEach((option) => {
              if (staffData[option]) {
                preFilledStaff[option] = staffData[option];
              }
            });

            setStaffSelectedByOption(preFilledStaff);
          }
        } catch (error) {
          console.error("Error fetching production data:", error);
        }
      }
    };

    if (
      props.openEditForm?.details?.id != undefined &&
      props.openEditForm?.details?.id != null &&
      props.openEditForm?.details?.id != ""
    ) {
      fetchProductionData();
    }

    if (props.categoryToEdit == "Production Detail") {
      stopCamera();
      startCamera();
    }
  }, [props.openEditForm?.details?.id]);

  useEffect(() => {
    const loadStaff = async () => {
      const res = await fetchUsersByRole();
      if (res.success && res.data) {
        setStaffList(res.data);
      }
    };

    loadStaff();
  }, [props.openEditForm.details]);

  const startCamera = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Only call play after metadata is loaded
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error("Error playing video:", err);
          });
        };
      }

      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing the camera:", err);
      alert("Unable to access the camera. Please check permissions.");
    }
  };

  const handleDeleteImage = (index: number) => {
    setImageSrcList((prevList) => prevList.filter((_, i) => i !== index));
  };

  const convertBase64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/png");
        setImageSrcList((prevList) => [...prevList, dataUrl]);
      }
    }
  };

  const stopCamera = (): void => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const handleAdd = async () => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    try {
      await addDoc(collection(db, `productions-${props.region}`), {
        customer_name: customerName,
        created_date: formattedDate,
      });
      props.setOpenEditForm({ status: false, details: null });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
    props.fetchData();
  };

  const handleUpdate = async () => {
    try {
      if (
        props.openEditForm?.details?.id == undefined ||
        props.openEditForm?.details?.id == null ||
        props.openEditForm?.details?.id === ""
      )
        return;

      setLoading(true);
      const docRef = doc(
        db,
        `productions-${props.region}`,
        props.openEditForm?.details?.id
      );

      const currentDate = new Date();

      if (props.categoryToEdit != "Customer") {
        const uploadImageAndGetURL = async (file: any) => {
          const storageRef = ref(storage, `production_images/${file.name}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        };

        const imageURLs = await Promise.all(
          imageSrcList.map(async (src, idx) => {
            const file = convertBase64ToFile(
              src,
              `image_${Date.now()}_${idx}.png`
            );
            return await uploadImageAndGetURL(file);
          })
        );

        const productionDetails = imageURLs.map((url) => ({
          description,
          imageSrc: url,
          timestamp: currentDate,
        }));

        await updateDoc(docRef, {
          detail_production: arrayUnion(...productionDetails),
        });
      } else if (props.categoryToEdit == "Customer") {
        await updateDoc(docRef, {
          customer_name: customerName,
        });
      }

      setLoading(false);
      props.fetchData();
      props.setOpenEditForm({ status: false, details: null });
    } catch (error) {
      console.error("Error updating data:", error);
    }
  };

  const handleSave = async (option: string, staffName: string) => {
    try {
      if (!props.openEditForm?.details?.id) return;

      const docRef = doc(
        db,
        `productions-${props.region}`,
        props.openEditForm.details.id
      );

      const updateData = {
        [`production_staff.${option}`]: staffName,
        [`production_staff.${option}_timestamp`]: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);
      props.fetchData();
      props.setOpenEditForm({ status: false, details: null });
    } catch (error) {
      console.error("Error saving production staff:", error);
    }
  };

  return (
    <div
      className="fixed w-full h-full flex justify-center items-center bg-black/50 px-2 z-50 top-0 left-0"
      onClick={(e) => {
        props.setOpenEditForm({ status: false, details: null });
      }}
    >
      <div
        className="w-full sm:w-[400px] bg-white rounded-md p-5 flex flex-col gap-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Label className="text-2xl font-semibold">Detail Produksi</Label>
        <div
          className="absolute top-4 right-1.5 hover:bg-black/10 rounded-full p-1.5 cursor-pointer"
          onClick={(e) => {
            props.setOpenEditForm({ status: false, details: null });
          }}
        >
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            viewBox="0 0 48 48"
          >
            <path d="M 39.486328 6.9785156 A 1.50015 1.50015 0 0 0 38.439453 7.4394531 L 24 21.878906 L 9.5605469 7.4394531 A 1.50015 1.50015 0 0 0 8.484375 6.984375 A 1.50015 1.50015 0 0 0 7.4394531 9.5605469 L 21.878906 24 L 7.4394531 38.439453 A 1.50015 1.50015 0 1 0 9.5605469 40.560547 L 24 26.121094 L 38.439453 40.560547 A 1.50015 1.50015 0 1 0 40.560547 38.439453 L 26.121094 24 L 40.560547 9.5605469 A 1.50015 1.50015 0 0 0 39.486328 6.9785156 z"></path>
          </svg>
        </div>
        <div className="w-full">
          <div className="grid w-full items-center space-y-2 mb-5">
            <Label htmlFor="customerName">Nama Pelanggan</Label>
            <Input
              className="w-full text-text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              id="customerName"
              readOnly={
                props.openEditForm?.details?.id != null &&
                props.openEditForm?.details?.id != undefined &&
                props.openEditForm?.details?.id != "" &&
                props.categoryToEdit != "Customer"
              }
              type="name"
            />
          </div>
          {props.categoryToEdit === "Customer" && (
            <button
              className="w-full bg-[var(--primary-color)] hover:bg-[#301094] cursor-pointer py-1.5 rounded-md text-white flex justify-center items-center gap-2 mt-4"
              onClick={handleUpdate}
            >
              Simpan Detail Produksi
            </button>
          )}
          {props.openEditForm?.details?.id != null &&
            props.openEditForm?.details?.id != "" &&
            props.categoryToEdit == "Production Detail" && (
              <div className="grid w-full items-center gap-1.5 mb-5">
                <Label htmlFor="dynamicField">Gambar Produksi</Label>
                <div className="relative flex justify-center items-center border rounded-md">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: "100%", height: "auto" }}
                    className="border"
                  ></video>
                  <button
                    className="w-auto absolute bottom-1 rounded-full p-5 bg-black/50"
                    type="submit"
                    onClick={capturePhoto}
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>
                {imageSrcList.length > 0 && (
                  <div className="w-full flex flex-col justify-start items-start gap-2">
                    <Label className="text-gray-600 italic">
                      {imageSrcList.length} Gambar
                    </Label>
                    <div className="w-full flex justify-start items-center gap-2 overflow-x-auto mb-2 py-2">
                      {imageSrcList.map((src, index) => (
                        <div className="relative w-auto h-auto" key={index}>
                          <X
                            className="size-4 cursor-pointer absolute -top-1.5 -right-1.5 p-0.5 text-red-600 bg-red-200/50 rounded-md shadow-md"
                            onClick={() => handleDeleteImage(index)}
                          />
                          <img
                            src={src}
                            alt={`Captured ${index + 1}`}
                            className="w-20 h-20 object-cover border"
                          />
                        </div>
                      ))}
                    </div>
                    <Input
                      className="w-full text-text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      id="description"
                      placeholder="Tulis Keterangan Singkat . . ."
                      type="text"
                      required
                    />

                    {loading ? (
                      <div role="status">
                        <svg
                          aria-hidden="true"
                          className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                          viewBox="0 0 100 101"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                            fill="currentColor"
                          />
                          <path
                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                            fill="currentFill"
                          />
                        </svg>
                        <span className="sr-only">Loading...</span>
                      </div>
                    ) : (
                      <button
                        className="w-full bg-[var(--primary-color)] hover:bg-[#301094] cursor-pointer py-1.5 rounded-md text-white flex justify-center items-center gap-2 mt-4"
                        onClick={handleUpdate}
                      >
                        Simpan Detail Produksi
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          {props.openEditForm?.details?.id &&
            props.categoryToEdit === "Production Staff" && (
              <div className="flex flex-col gap-4">
                {options.map((option) => {
                  const selectedStaff = staffSelectedByOption[option] || "";
                  return (
                    <div
                      key={option}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <Label className="capitalize mb-2 block">
                          {option}
                        </Label>
                        <Popover
                          open={openStaffForOption[option] || false}
                          onOpenChange={(open) =>
                            setOpenStaffForOption((prev) => ({
                              ...prev,
                              [option]: open,
                            }))
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={
                                openStaffForOption[option] || false
                              }
                              className={`w-full justify-between font-normal ${
                                selectedStaff
                                  ? "text-gray-800"
                                  : "text-gray-500"
                              }`}
                            >
                              {selectedStaff || `Pilih staff untuk ${option}`}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="min-w-[340px] w-full p-0">
                            <Command>
                              <CommandInput
                                placeholder={`Cari staff untuk ${option}`}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  Staff tidak ditemukan.
                                </CommandEmpty>
                                <CommandGroup>
                                  {staffList.map((staff) => (
                                    <CommandItem
                                      key={staff.uid}
                                      value={staff.name}
                                      onSelect={(currentValue) => {
                                        setStaffSelectedByOption((prev) => ({
                                          ...prev,
                                          [option]:
                                            currentValue === prev[option]
                                              ? ""
                                              : currentValue,
                                        }));
                                        setOpenStaffForOption((prev) => ({
                                          ...prev,
                                          [option]: false,
                                        }));
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedStaff === staff.name
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {staff.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="mt-6">
                        <button
                          className="w-full bg-[var(--primary-color)] hover:bg-[#301094] cursor-pointer py-1.5 rounded-md text-white flex justify-center items-center gap-2 min-w-20"
                          onClick={() => handleSave(option, selectedStaff)}
                          disabled={!selectedStaff}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

          <div className="w-full mt-3">
            {(props.openEditForm?.details?.id == null ||
              props.openEditForm?.details?.id == "") && (
              <button
                className="w-full bg-[var(--primary-color)] hover:bg-[#301094] cursor-pointer py-1.5 rounded-md text-white flex justify-center items-center gap-2"
                onClick={handleAdd}
              >
                + Tambah Produksi
              </button>
            )}
            {/* {props.openEditForm?.details?.id != null &&
              props.openEditForm?.details?.id != "" &&
              props.categoryToEdit == "Production Staff" && (
                <button
                  className="w-full bg-[var(--primary-color)] hover:bg-[#301094] cursor-pointer py-1.5 rounded-md text-white flex justify-center items-center gap-2 mt-4"
                  onClick={handleSave}
                >
                  Simpan Karyawan Produksi
                </button>
              )} */}
          </div>
        </div>
      </div>
    </div>
  );
}
