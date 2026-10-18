"use client";
import React, { Dispatch, SetStateAction, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { BadgeCheck } from "lucide-react";
import PhotoSlot from "../photo-slot";
import { cn } from "@/lib/utils";
import {
  addCashReport,
  CashType,
  deleteCashReport,
  getCashReportPhotos,
  MAX_CASH_REPORT_PHOTOS,
  updateCashReport,
} from "@/lib/cash-report";
import { CashReport } from "@/types/cash-report";

interface CashReportFormProps {
  fetchData: () => void;
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>;
  openEditForm: { status: boolean; details: any };
  collectionName: string;
}

const CASH_TYPE_OPTIONS: { value: CashType; label: string; activeClass: string }[] = [
  { value: "income", label: "Pemasukan", activeClass: "text-green-600" },
  { value: "expense", label: "Pengeluaran", activeClass: "text-red-600" },
];

const formatRupiah = (value: number) =>
  value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

function CashReportForm(props: CashReportFormProps) {
  const details: CashReport | null = props.openEditForm?.details ?? null;
  const isEdit = !!details?.id;
  const originalCashType: CashType = details?.income ? "income" : "expense";

  const [information, setInformation] = useState(details?.information ?? "");
  const [amount, setAmount] = useState(() => {
    const value = details?.income || details?.expense;
    return value ? String(value) : "";
  });
  const [cashType, setCashType] = useState<CashType>(
    isEdit ? originalCashType : "income"
  );
  const [photos, setPhotos] = useState<(string | null)[]>(() => {
    const existing = getCashReportPhotos(details);
    return Array.from(
      { length: MAX_CASH_REPORT_PHOTOS },
      (_, index) => existing[index] ?? null
    );
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const parsedAmount = Number(amount);
  const amountPreview =
    amount && Number.isFinite(parsedAmount) && parsedAmount > 0
      ? formatRupiah(parsedAmount)
      : "";

  const close = () => {
    props.setOpenEditForm({ status: false, details: null });
    props.fetchData();
  };

  const updatePhoto = (index: number, value: string | null) => {
    setError("");
    setPhotos((prev) => prev.map((photo, i) => (i === index ? value : photo)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!information.trim()) {
      setError("Informasi wajib diisi.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Nominal harus lebih dari 0.");
      return;
    }

    setSaving(true);
    setError("");

    const input = { information, cashType, amount: parsedAmount, photos };
    const result =
      isEdit && details
        ? await updateCashReport(
          props.collectionName,
          details.id,
          input,
          originalCashType
        )
        : await addCashReport(props.collectionName, input);

    setSaving(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    close();
  };

  const handleDelete = async () => {
    if (!details?.id || saving) return;
    setSaving(true);
    setError("");
    const result = await deleteCashReport(props.collectionName, details.id);
    setSaving(false);
    if (!result.success) {
      setError(result.message);
      setConfirmDelete(false);
      return;
    }
    close();
  };

  return (
    <form
      noValidate
      onSubmit={handleSave}
      onClick={(e) => e.stopPropagation()}
      className="w-full sm:w-[420px] bg-white rounded-md p-7 max-h-[90dvh] overflow-y-auto"
    >
      <div className="mb-5 flex justify-between items-end gap-3">
        <Label className="text-xl font-semibold">Detail Kas Tunai</Label>
        {isEdit &&
          (confirmDelete ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-600">Yakin hapus?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="text-red-600 font-semibold cursor-pointer hover:underline disabled:opacity-50"
              >
                Ya, hapus
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={saving}
                className="text-gray-600 cursor-pointer hover:underline disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              className="text-red-600 cursor-pointer hover:underline disabled:opacity-50"
            >
              Hapus
            </button>
          ))}
      </div>

      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="information">Informasi</Label>
        <Input
          className="w-full text-text"
          value={information}
          onChange={(e) => {
            setError("");
            setInformation(e.target.value);
          }}
          id="information"
          type="text"
          disabled={saving}
        />
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="amount">Nominal</Label>
        <Input
          className="w-full text-text"
          value={amount}
          onChange={(e) => {
            setError("");
            setAmount(e.target.value);
          }}
          id="amount"
          type="number"
          inputMode="numeric"
          min={1}
          step="any"
          disabled={saving}
        />
        {amountPreview && (
          <span className="text-xs text-gray-500 pl-0.5">{amountPreview}</span>
        )}
      </div>
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label>Jenis Kas Tunai</Label>
        <div className="flex justify-between gap-3 h-7 w-fit mt-2">
          {CASH_TYPE_OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              {index > 0 && <Separator orientation="vertical" />}
              <button
                type="button"
                aria-pressed={cashType === option.value}
                onClick={() => {
                  setError("");
                  setCashType(option.value);
                }}
                disabled={saving}
                className={cn(
                  "flex-1 text-sm cursor-pointer",
                  index === 0 ? "pl-1 text-left" : "pr-1 text-right",
                  cashType === option.value
                    ? `${option.activeClass} font-semibold`
                    : "text-gray-600"
                )}
              >
                {option.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="grid w-full gap-1.5 mb-5">
        <Label>Nota</Label>
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <PhotoSlot
              key={index}
              label={`Foto Nota ${index + 1}`}
              value={photo}
              onChange={(value) => updatePhoto(index, value)}
              disabled={saving}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">
          Opsional, maksimal {MAX_CASH_REPORT_PHOTOS} foto dari kamera atau galeri.
        </span>
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[var(--primary-color)] text-white rounded-md py-1.5 cursor-pointer flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <BadgeCheck className="size-4" />
        {saving ? "Menyimpan..." : "Simpan Tunai"}
      </button>
    </form>
  );
}

export default CashReportForm;