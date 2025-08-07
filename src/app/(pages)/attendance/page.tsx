'use client';
import dynamic from 'next/dynamic';
import React from 'react';
 
const Page = dynamic(() => import('./_Attendance'), {
  ssr: false,
});

export default function AttendanceWrapper() {
  return <Page />;
}