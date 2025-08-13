"use client";
import dynamic from "next/dynamic";
import React from "react";

const Page = dynamic(() => import("./_Cash"), {
  ssr: false,
});

export default function CashWrapper() {
  return <Page />;
}
