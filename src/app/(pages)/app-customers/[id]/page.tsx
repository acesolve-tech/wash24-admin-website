"use client";
import dynamic from "next/dynamic";

const Page = dynamic(() => import("./_AppCustomer"), {
    ssr: false,
});

export default function AppCustomerWrapper() {
    return <Page />;
}