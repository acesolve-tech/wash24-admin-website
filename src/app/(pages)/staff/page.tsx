'use client';
import dynamic from 'next/dynamic';
import React from 'react';
 
const Page = dynamic(() => import('./_Staff'), {
  ssr: false,
});

export default function StaffWrapper() {
  return <Page />;
}