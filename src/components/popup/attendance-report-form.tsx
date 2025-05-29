"use client";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Timestamp } from "firebase/firestore";
import { updateAttendance } from "@/lib/attendance";

interface AttendanceReportFormProps {
  fetchData: any;
  setOpenEditForm: Dispatch<SetStateAction<{ status: boolean; details: any }>>;
  openEditForm: { status: boolean; details: any };
  selectedDate: Date | undefined;
}

function AttendanceReportForm(props: AttendanceReportFormProps) {
  const [name, setName] = useState("");
  const [clockInHours, setClockInHours] = useState("");
  const [clockInMinutes, setClockInMinutes] = useState("");
  const [clockOutHours, setClockOutHours] = useState("");
  const [clockOutMinutes, setClockOutMinutes] = useState("");

  const [restStartHours, setRestStartHours] = useState("");
  const [restStartMinutes, setRestStartMinutes] = useState("");
  const [restEndHours, setRestEndHours] = useState("");
  const [restEndMinutes, setRestEndMinutes] = useState("");

  const getTimeFromTimestamp = (timestamp?: Timestamp) => {
    if (timestamp instanceof Timestamp) {
      const milliseconds =
        timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000;
      const date = new Date(milliseconds);
      return {
        hours: date.getHours().toString(),
        minutes: date.getMinutes().toString(),
      };
    }
    return { hours: "", minutes: "" };
  };

  useEffect(() => {
    const details = props.openEditForm?.details;

    setName(details?.name || "");

    if (details) {
      const { hours: inHours, minutes: inMinutes } = getTimeFromTimestamp(
        details.clock_in
      );
      setClockInHours(inHours);
      setClockInMinutes(inMinutes);

      const { hours: outHours, minutes: outMinutes } = getTimeFromTimestamp(
        details.clock_out
      );
      setClockOutHours(outHours);
      setClockOutMinutes(outMinutes);

      const { hours: restStartHoursVal, minutes: restStartMinutesVal } =
        getTimeFromTimestamp(details.rest_start);
      setRestStartHours(restStartHoursVal);
      setRestStartMinutes(restStartMinutesVal);

      const { hours: restEndHoursVal, minutes: restEndMinutesVal } =
        getTimeFromTimestamp(details.rest_end);
      setRestEndHours(restEndHoursVal);
      setRestEndMinutes(restEndMinutesVal);
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      selectedName: name,
      clockInHours,
      clockInMinutes,
      clockOutHours,
      clockOutMinutes,
      restStartHours,
      restStartMinutes,
      restEndHours,
      restEndMinutes,
    };

    const result = await updateAttendance(props.selectedDate, payload);
    props.setOpenEditForm({ status: false, details: null });
    props.fetchData();
  };

  return (
    <form
      onSubmit={onSubmit}
      onClick={(e) => e.stopPropagation()}
      className="w-full sm:w-[400px] bg-white rounded-md p-7"
    >
      <div className="grid w-full items-center gap-1.5 mb-5">
        <Label htmlFor="name">Name</Label>
        <Input
          className="w-full text-text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          id="name"
          type="name"
          readOnly
        />
      </div>
      <div className="flex gap-1.5 text-3xl justify-between items-end h-14 mb-5">
        <div className="flex flex-col items-start gap-1.5">
          <Label htmlFor="clockIn">Datang Kerja</Label>
          <div className="flex gap-1.5 text-3xl">
            <Input
              className="w-[40%] text-text"
              value={clockInHours}
              onChange={(e) => setClockInHours(e.target.value)}
              id="clockInHours"
              type="number"
              max={23}
              min={0}
            />{" "}
            :
            <Input
              className="w-[40%] text-text"
              value={clockInMinutes}
              onChange={(e) => setClockInMinutes(e.target.value)}
              id="clockInMinutes"
              type="number"
              max={59}
              min={0}
            />
          </div>
        </div>
        <Separator orientation="vertical" />
        <div className="flex flex-col items-end gap-1.5">
          <Label htmlFor="clockOut">Pulang Kerja</Label>
          <div className="flex gap-1.5 text-3xl justify-end">
            <Input
              className="w-[40%] text-text"
              value={clockOutHours}
              onChange={(e) => setClockOutHours(e.target.value)}
              id="clockOutHours"
              type="number"
              max={23}
              min={0}
            />{" "}
            :
            <Input
              className="w-[40%] text-text"
              value={clockOutMinutes}
              onChange={(e) => setClockOutMinutes(e.target.value)}
              id="clockOutMinutes"
              type="number"
              max={59}
              min={0}
            />
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 text-3xl justify-between items-end h-14 mb-5">
        <div className="flex flex-col items-start gap-1.5">
          <Label htmlFor="clockIn">Istirahat Mulai</Label>
          <div className="flex gap-1.5 text-3xl">
            <Input
              className="w-[40%] text-text"
              value={restStartHours}
              onChange={(e) => setRestStartHours(e.target.value)}
              id="restStartHours"
              type="number"
              max={23}
              min={0}
            />{" "}
            :
            <Input
              className="w-[40%] text-text"
              value={restStartMinutes}
              onChange={(e) => setRestStartMinutes(e.target.value)}
              id="restStartMinutes"
              type="number"
              max={59}
              min={0}
            />
          </div>
        </div>
        <Separator orientation="vertical" />
        <div className="flex flex-col items-end gap-1.5">
          <Label htmlFor="clockOut">Istirahat Selesai</Label>
          <div className="flex gap-1.5 text-3xl justify-end">
            <Input
              className="w-[40%] text-text"
              value={restEndHours}
              onChange={(e) => setRestEndHours(e.target.value)}
              id="restEndHours"
              type="number"
              max={23}
              min={0}
            />{" "}
            :
            <Input
              className="w-[40%] text-text"
              value={restEndMinutes}
              onChange={(e) => setRestEndMinutes(e.target.value)}
              id="restEndMinutes"
              type="number"
              max={59}
              min={0}
            />
          </div>
        </div>
      </div>

      <div className="w-full mt-1">
        <button className="w-full bg-[var(--primary-color)] text-white rounded-md py-1.5">
          Simpan
        </button>
      </div>
    </form>
  );
}

export default AttendanceReportForm;
