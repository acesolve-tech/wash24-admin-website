"use client";
import dynamic from "next/dynamic";
import React from "react";

const Page = dynamic(() => import("./_Otp"), {
  ssr: false,
});

export default function OtpWrapper() {
  return <Page />;
}
