"use client";
import dynamic from "next/dynamic";
 
const Page = dynamic(() => import("./_AppServices"), {
  ssr: false,
});
 
export default function AppServicesWrapper() {
  return <Page />;
}