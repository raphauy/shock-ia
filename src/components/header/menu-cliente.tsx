"use client"

import { getDataClientBySlug } from "@/app/admin/clients/(crud)/actions";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

export default function MenuCliente() {
    const path= usePathname()
    const params= useParams()
    const clientSlug= params.slug as string
    console.log(clientSlug)

    const [haveAgentes, setHaveAgentes]= useState(false)

    useEffect(() => {
        if (clientSlug) {
            getDataClientBySlug(clientSlug)
            .then((client) => {
                setHaveAgentes(client?.haveAgents || false)
            })
            .catch((error) => {
                console.log(error)
            })
        }
    }, [clientSlug])

    if (!haveAgentes) return null

    return (
        <div className="flex flex-1 gap-6 pl-5 md:gap-5 ">
            <nav>
                <ul className="flex items-center">
                    <li className={`flex items-center border-b-shock-color hover:border-b-shock-color hover:border-b-2 h-11 whitespace-nowrap ${path === "/agentes" && "border-b-2"}`}>
                        <Link href={`/agentes`}>
                            <Button className="text-lg" variant="ghost">
                                Agentes
                            </Button>
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}