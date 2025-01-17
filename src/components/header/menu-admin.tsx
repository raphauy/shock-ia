"use client"

import Link from "next/link"
import { Button } from "../ui/button"
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clientHaveCRMAction, clientHaveEventsAction } from "@/app/admin/clients/(crud)/actions";

export default function MenuAdmin() {

    const path= usePathname()

    const [slug, setSlug]= useState("")
    const [haveEvents, setHaveEvents]= useState(false)
    const [haveCRM, setHaveCRM]= useState(false)

    useEffect(() => {
        const newSlug= path.split('/')[2]
        if (newSlug) {
            setSlug(newSlug)
        } else {
            setSlug("")
        }
    }, [path])

    useEffect(() => {
        clientHaveEventsAction(slug)
        .then((haveEvents) => {
            if (haveEvents) {
                setHaveEvents(true)
            } else {
                setHaveEvents(false)
            }                
        })
        .catch((error) => {
            console.log(error)
        })
        clientHaveCRMAction(slug)        
        .then((haveCRM) => {
            if (haveCRM) {
                setHaveCRM(true)
            } else {
                setHaveCRM(false)
            }
        })
        .catch((error) => {
            console.log(error)
        })
    }, [slug])


    return (
        <div className="flex-1 hidden gap-6 pl-5 md:flex md:gap-5">
            <nav>
                <ul className="flex items-center">
                    { slug && (
                        <li className={`flex items-center border-b-shock-color hover:border-b-shock-color hover:border-b-2 h-11 ${path === `/client/${slug}` && "border-b-2"}`}>
                            <Link href={`/client/${slug}`}><Button className="text-lg" variant="ghost">Inicio</Button></Link>
                        </li>
                    )}

                    <li className={`flex items-center border-b-shock-color hover:border-b-shock-color hover:border-b-2 h-11 ${path.includes("admin") && "border-b-2"}`}>
                        <Link href={`/admin?slug=${slug}`}><Button className="text-lg" variant="ghost">Admin</Button></Link>
                    </li>
                    {
                        haveEvents &&
                        <li className={`flex items-center border-b-shock-color hover:border-b-shock-color hover:border-b-2 h-11 ${path.includes("events") && "border-b-2"}`}>
                            <Link href={`/client/${slug}/events`}><Button className="text-lg" variant="ghost">Reservas</Button></Link>
                        </li>
                    }
                    {
                        haveCRM &&
                        <li className={`flex items-center border-b-shock-color hover:border-b-shock-color hover:border-b-2 h-11 ${path.includes("crm") && "border-b-2"}`}>
                            <Link href={`/client/${slug}/crm`}><Button className="text-lg" variant="ghost">CRM</Button></Link>
                        </li>
                    }
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
