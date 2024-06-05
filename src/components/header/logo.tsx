"use client";

import Image from "next/image";
import Link from "next/link";


export default function Logo() {

  return (
    // <Link href="/">
    //   <div className="flex flex-col items-center">
    //     <Image src="/logo-osom-room.png" width={120} height={50} alt="Osom logo" />        
    //   </div>
    // </Link>
    <Link href="/">
      <div className="text-3xl font-bold">
        {/* <span className="text-rosa-osom">Osom</span>
        <span className="text-verde-openai">GPT</span>
        <span className="text-gray-300">.com</span> */}
        <Image src="/logo.png" width={200} height={50} alt="Osom logo" className="rounded-md" />
      </div>
    </Link>

  )
}
