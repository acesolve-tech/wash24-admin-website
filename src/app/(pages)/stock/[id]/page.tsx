"use client";
import dynamic from "next/dynamic";
import React from "react";

const Page = dynamic(() => import("./_Stock"), {
  ssr: false,
});

export default function StockWrapper() {
  return <Page />;
}
