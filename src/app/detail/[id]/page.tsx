"use client";

import { useParams } from "next/navigation";
import React from "react";

const page = () => {
  const { id } = useParams();

  return (
    <div className="w-full min-h-screen">
      <div className="flex justify-center items-center w-screen h-screen fixed top-0 left-0 -z-10 opacity-5">
        <img src="/assets/logo.webp" className="w-96" alt="Wash24 Logo" />
      </div>
      <section className="w-full flex justify-center items-center min-h-screen">
        <div className="bg-white/50 rounded-md shadow-xl w-96 h-96 border">

        </div>
      </section>
    </div>
  );
};

export default page;
