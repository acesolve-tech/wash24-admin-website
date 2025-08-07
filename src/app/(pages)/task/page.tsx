"use client";
import dynamic from "next/dynamic";
import React from "react";

const Page = dynamic(() => import("./_Task"), {
  ssr: false,
});

export default function TaskWrapper() {
  return <Page />;
}
