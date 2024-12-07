"use client";

import Image from "next/image";
import Link from "next/link";


export default function Logo() {

  return (
    <Link href="/">
      <div className="text-3xl font-bold mt-1">
        {/* <Image src="/logo.png" width={200} height={50} alt="Shock logo" className="rounded-md" /> */}
        <Image src="/xplora.jpg" width={40} height={40} alt="Xplora logo" className="rounded-md" />
      </div>
    </Link>

  )
}
