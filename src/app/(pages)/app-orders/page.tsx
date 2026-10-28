"use client";
import dynamic from "next/dynamic";

const Page = dynamic(() => import("./_AppOrders"), {
    ssr: false,
});

export default function AppOrdersWrapper() {
    return <Page />;
}