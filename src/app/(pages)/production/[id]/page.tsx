"use client";
import dynamic from "next/dynamic";
import React from "react";

const Page = dynamic(() => import("./_Production"), {
  ssr: false,
});

export default function ProductionWrapper() {
  return <Page />;
}
