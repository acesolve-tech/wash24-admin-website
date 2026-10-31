"use client";
import dynamic from "next/dynamic";

const Page = dynamic(() => import("./_AppNotifications"), {
    ssr: false,
});

export default function AppNotificationsWrapper() {
    return <Page />;
}