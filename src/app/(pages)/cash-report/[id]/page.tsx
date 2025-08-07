"use client";
import dynamic from "next/dynamic";
import React from "react";

const Page = dynamic(() => import("./_CashReport"), {
  ssr: false,
});

export default function CashReportWrapper() {
  return <Page />;
}
