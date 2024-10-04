"use client"

import Link from "next/link"
import { Button } from "../ui/button"
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clientHaveEventsAction } from "@/app/admin/clients/(crud)/actions";

export default function MenuAdmin() {

    const path= usePathname()

    const [slug, setSlug]= useState("")

    useEffect(() => {
        const newSlug= path.split('/')[2]
        if (newSlug) {
            clientHaveEventsAction(newSlug)
            .then((haveEvents) => {
                if (haveEvents) {
                    setSlug(newSlug)
                } else {
                    setSlug("")
                }
            })
            .catch((error) => {
                console.log(error)
            })
        } else {
            setSlug("")
        }
    }, [path])

    return (
        <div className="flex-1 hidden gap-6 pl-5 lg:flex md:gap-5">
            <nav>
                <ul className="flex items-center">
                    <li className={`flex items-center border-b-shock-color hover:border-b-shock-color hover:border-b-2 h-11 ${path.includes("admin") && "border-b-2"}`}>
                        <Link href="/admin"><Button className="text-lg" variant="ghost">Admin</Button></Link>
                    </li>
                    {
                        slug &&
                        <li className={`flex items-center border-b-shock-color hover:border-b-shock-color hover:border-b-2 h-11 ${path.includes("events") && "border-b-2"}`}>
                            <Link href={`/client/${slug}/events`}><Button className="text-lg" variant="ghost">Reservas</Button></Link>
                        </li>
                    }
                </ul>
            </nav>
        </div>
    );
}
