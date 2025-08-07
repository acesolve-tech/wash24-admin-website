"use client";
import dynamic from "next/dynamic";
import React from "react";

const Page = dynamic(() => import("./_AttendanceReport"), {
  ssr: false,
});

export default function AttendanceReportWrapper() {
  return <Page />;
}
