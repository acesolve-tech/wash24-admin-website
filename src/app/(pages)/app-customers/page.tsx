"use client";
import dynamic from "next/dynamic";

const Page = dynamic(() => import("./_AppCustomers"), {
    ssr: false,
});

export default function AppCustomersWrapper() {
    return <Page />;
}