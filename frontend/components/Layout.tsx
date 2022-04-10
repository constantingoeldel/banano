import Image from "next/image";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="-ml-9 -mb-5">
        <Image src="/banano.svg" alt="Banano logo" height={50} width={400} />
      </div>
      {children}
    </>
  );
}
