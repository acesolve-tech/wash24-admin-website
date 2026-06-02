"use client";

import { Label } from "@/components/ui/label";
import { LOCATIONS } from "@/constants";
import { useParams } from "next/navigation";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Production } from "@/types/production";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { userStore } from "@/store/user";
import { fetchProduction } from "@/lib/production";
import Loading from "@/components/Loading";
import ProductionForm from "@/components/popup/production-form";
import ProductionExportForm from "@/components/popup/production-export-form";
import { PiShareFatThin } from "react-icons/pi";

const Page = () => {
  const { id } = useParams();
  const location = LOCATIONS.find((loc) => loc.key === id);
  const title = location?.title || "Unknown Location";

  const [data, setData] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [categoryToEdit, setCategoryToEdit] = useState("");
  const [exportForm, setExportForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState({
    status: false,
    details: null,
  });

  const fetchData = async () => {
    setLoading(true);
    const result = await fetchProduction(
      selectedDate,
      Array.isArray(id) ? id[0] : id ?? ""
    );
    setData((result?.success && result.data) ?? result?.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  return (
    <div className="min-h-[calc(100dvh-40px)] overflow-y-auto space-y-6">
      <Label className="text-3xl font-bold w-fit">Produksi {title}</Label>
      <div className="w-full flex flex-col justify-start items-start min-h-[80dvh]">
        <DataTable
          columns={getColumns(
            setOpenEditForm,
            Array.isArray(id) ? id[0] : id ?? "",
            setCategoryToEdit
          )}
          data={data}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          setOpenEditForm={setOpenEditForm}
          setExportForm={setExportForm}
        />
      </div>
      {openEditForm.status && (
        <div
          className="fixed w-screen h-screen top-0 left-0 bg-black/50 flex justify-center items-center z-10"
          onClick={() => setOpenEditForm({ status: false, details: null })}
        >
          <ProductionForm
            fetchData={fetchData}
            setOpenEditForm={setOpenEditForm}
            openEditForm={openEditForm}
            region={Array.isArray(id) ? id[0] : id ?? ""}
            categoryToEdit={categoryToEdit}
          />
        </div>
      )}

      {exportForm && (
        <ProductionExportForm
          region={Array.isArray(id) ? id[0] : id ?? ""}
          setExportForm={setExportForm}
        />
      )}
      {loading && <Loading />}
    </div>
  );
};

export default Page;

const getColumns = (
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>,
  locationId: string,
  setCategoryToEdit: Dispatch<SetStateAction<string>>
): ColumnDef<Production>[] => [
  {
    header: "",
    accessorKey: "share",
    cell: ({ row }) => {
      const [copied, setCopied] = useState(false);
      const { id } = useParams();
      const customerId = row.original.id;
      const shareUrl = `https://www.washcust.app/detail/${id}/${customerId}`;

      const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500); 
      };

      return (
        <div className="group relative mt-2">
          <button
            onClick={handleCopy}
            className="hover:text-primary cursor-pointer"
          >
            <PiShareFatThin size={20} />
          </button>
          <div className="absolute -top-7 -left-1 z-10 opacity-0 group-hover:opacity-100 inline-block px-2 py-1 text-xs font-medium text-white transition-opacity duration-300 bg-gray-600 rounded-sm shadow-xs tooltip">
            <span>{copied ? "Copied!" : "Copy"}</span>
            <div className="tooltip-arrow" data-popper-arrow></div>
          </div>
        </div>
      );
    },
  },
  {
    header: "Pelanggan",
    accessorKey: "customer_name",
    cell: ({ row }) => {
      const id = row.original.id.toString();
      const name = row.original.customer_name;

      const user = userStore((state: any) => state.user);
      if (user.role == "Master") {
        return (
          <div
            className="w-64 text-wrap"
            onClick={() => {
              setOpenEditForm({ status: true, details: row.original }),
                setCategoryToEdit("Customer");
            }}
          >
            {name}
          </div>
        );
      }
      return name;
    },
  },
  {
    header: "No. Tlp",
    accessorKey: "customer_phone",
    cell: ({ row }) => {
      const id = row.original.id.toString();
      const name = row.original.customer_phone;

      const user = userStore((state: any) => state.user);
      if (user.role == "Master") {
        return (
          <div
            className="w-40 text-wrap"
            onClick={() => {
              setOpenEditForm({ status: true, details: row.original }),
                setCategoryToEdit("Customer");
            }}
          >
            {name}
          </div>
        );
      }
      return name;
    },
  },
  {
    header: "Detail Produksi",
    accessorKey: "production_details",
    cell: ({ row }) => {
      const user = userStore((state: any) => state.user);
      const productionDetails = row.original.detail_production || [];
      const productionStaff = row.original.production_staff || [];
      const id = row.original.id.toString();
      const [showPopup, setShowPopup] = useState(false);
      const [selectedImage, setSelectedImage] = useState<any>(null);

      const handleImageClick = (detail: any) => {
        setSelectedImage(detail);
        setShowPopup(true);
      };

      const handleClosePopup = () => {
        setShowPopup(false);
        setSelectedImage(null);
      };

      const formatTimestamp = (timestamp: Timestamp) => {
        if (!timestamp?.seconds) return "-";

        const date = new Date(timestamp.seconds * 1000);
        return new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
          .format(date)
          .replace(",", " -");
      };

      const handleDeleteImage = async () => {
        if (selectedImage) {
          try {
            const updatedDetails = productionDetails.filter(
              (detail: any) => detail.imageSrc !== selectedImage.imageSrc
            );

            const documentRef = doc(db, `productions-${locationId}`, id);

            await updateDoc(documentRef, {
              detail_production: updatedDetails,
            });

            row.original.detail_production = updatedDetails;

            handleClosePopup();
          } catch (error) {
            console.error("Error updating Firestore document: ", error);
          }
        }
      };

      return (
        <div className="overflow-x-auto flex flex-grow items-center justify-start gap-2 py-2">
          <div className="flex space-x-2">
            {productionDetails.map((detail: any, index: number) => {
              const { description, timestamp, imageSrc } = detail;
              let formatTimestamp = "";

              if (timestamp) {
                const date = timestamp.toDate();
                const month = date.getMonth() + 1;
                const day = date.getDate();
                const hours = date.getHours().toString().padStart(2, "0");
                const minutes = date.getMinutes().toString().padStart(2, "0");
                formatTimestamp = `(${day}/${month}, ${hours}:${minutes})`;
              }

              return (
                <div
                  key={index}
                  className="cursor-pointer w-36 h-36 flex-shrink-0"
                  onClick={() =>
                    handleImageClick({
                      description,
                      formatTimestamp,
                      imageSrc,
                    })
                  }
                >
                  <img
                    src={imageSrc}
                    alt="Production Detail"
                    className="w-36 h-36 object-cover rounded-md"
                    loading="lazy"
                  />
                </div>
              );
            })}
          </div>

          <div
            onClick={() => {
              setOpenEditForm({ status: true, details: row.original }),
                setCategoryToEdit("Production Detail");
            }}
            className=" h-36 min-w-32 w-auto rounded-md text-gray-500 cursor-pointer  flex items-center"
          >
            <div className="px-6 flex flex-col items-center justify-center h-36 w-auto border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50">
              <svg
                fill="#6B7280"
                height="30px"
                width="30px"
                version="1.1"
                id="Capa_1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 487 487"
                stroke="#6B7280"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  <g>
                    <g>
                      <path d="M308.1,277.95c0,35.7-28.9,64.6-64.6,64.6s-64.6-28.9-64.6-64.6s28.9-64.6,64.6-64.6S308.1,242.25,308.1,277.95z M440.3,116.05c25.8,0,46.7,20.9,46.7,46.7v122.4v103.8c0,27.5-22.3,49.8-49.8,49.8H49.8c-27.5,0-49.8-22.3-49.8-49.8v-103.9 v-122.3l0,0c0-25.8,20.9-46.7,46.7-46.7h93.4l4.4-18.6c6.7-28.8,32.4-49.2,62-49.2h74.1c29.6,0,55.3,20.4,62,49.2l4.3,18.6H440.3z M97.4,183.45c0-12.9-10.5-23.4-23.4-23.4c-13,0-23.5,10.5-23.5,23.4s10.5,23.4,23.4,23.4C86.9,206.95,97.4,196.45,97.4,183.45z M358.7,277.95c0-63.6-51.6-115.2-115.2-115.2s-115.2,51.6-115.2,115.2s51.6,115.2,115.2,115.2S358.7,341.55,358.7,277.95z"></path>
                    </g>
                  </g>
                </g>
              </svg>
              <p className="text-sm text-gray-500">
                <span className="font-semibold">Buka Kamera</span>
              </p>
              <p className="text-xs text-gray-500">
                {productionDetails.length} Photo
              </p>
            </div>
          </div>
          <div
            onClick={() => {
              setOpenEditForm({ status: true, details: row.original }),
                setCategoryToEdit("Production Staff");
            }}
            className=" h-36 min-w-32 w-auto rounded-md text-gray-500 cursor-pointer  flex items-center"
          >
            <div className="px-2.5 flex flex-col items-start justify-center h-36 min-w-28 w-auto border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50">
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Pick Up:</span>{" "}
                <span className="">{productionStaff?.pickup}</span>
                <span className="ml-1">
                  {formatTimestamp(productionStaff?.pickup_timestamp)}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Nota:</span>{" "}
                <span className="">{productionStaff?.nota}</span>
                <span className="ml-1">
                  {formatTimestamp(productionStaff?.nota_timestamp)}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Cuci:</span>{" "}
                <span className="">{productionStaff?.cuci}</span>
                <span className="ml-1">
                  {formatTimestamp(productionStaff?.cuci_timestamp)}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Kering:</span>{" "}
                <span className="">{productionStaff?.kering}</span>
                <span className="ml-1">
                  {formatTimestamp(productionStaff?.kering_timestamp)}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Setrika:</span>{" "}
                <span className="">{productionStaff?.setrika}</span>
                <span className="ml-1">
                  {formatTimestamp(productionStaff?.setrika_timestamp)}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Lipat:</span>{" "}
                <span className="">{productionStaff?.lipat}</span>
                <span className="ml-1">
                  {formatTimestamp(productionStaff?.lipat_timestamp)}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Packing:</span>{" "}
                <span className="">{productionStaff?.packing}</span>
                <span className="ml-1">
                  {formatTimestamp(productionStaff?.packing_timestamp)}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Delivery:</span>{" "}
                <span className="">{productionStaff?.delivery}</span>
                <span className="ml-1">
                  {formatTimestamp(productionStaff?.delivery_timestamp)}
                </span>
              </p>
            </div>
          </div>
          {showPopup && selectedImage && (
            <div
              className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
              onClick={handleClosePopup}
            >
              <div
                className="bg-white p-4 rounded-lg w-96"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedImage?.imageSrc}
                  alt="Selected Production Detail"
                  className="w-full h-60 object-cover rounded-md"
                />
                <div className="mt-2 flex justify-between items-end">
                  <div>
                    <p className="font-semibold text-lg">
                      {selectedImage?.description}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {selectedImage?.formatTimestamp &&
                        `Uploaded: ${selectedImage?.formatTimestamp}`}
                    </p>
                  </div>
                  {user.role == "Master" && (
                    <div
                      className="text-red-700 bg-red-300 px-2 py-1 rounded-md cursor-pointer"
                      onClick={handleDeleteImage}
                    >
                      Delete
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    },
  },
];
