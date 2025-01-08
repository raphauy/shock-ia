"use client"

import { clientHaveCRMAction, getDataClientBySlug } from "@/app/admin/clients/(crud)/actions";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

export default function MenuCliente() {
    const path= usePathname()
    const params= useParams()
    const clientSlug= params.slug as string

    const [haveAgentes, setHaveAgentes]= useState(false)
    const [haveEvents, setHaveEvents]= useState(false)
    const [haveCRM, setHaveCRM]= useState(false)

    useEffect(() => {
        if (clientSlug) {
            getDataClientBySlug(clientSlug)
            .then((client) => {
                setHaveAgentes(client?.haveAgents || false)
                setHaveEvents(client?.haveEvents || false)
            })
            .catch((error) => {
                console.log(error)
            })
            clientHaveCRMAction(clientSlug)        
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
            }
    }, [clientSlug])

    return (
        <div className="flex flex-1 gap-6 pl-5 md:gap-5 ">
            <nav>
                <ul className="flex items-center">
                    {haveAgentes && (
                    <li className={`flex items-center border-b-shock-color hover:border-b-shock-color hover:border-b-2 h-11 whitespace-nowrap ${path === "/agentes" && "border-b-2"}`}>
                        <Link href={`/agentes`}>
                            <Button className="text-lg" variant="ghost">
                                Agentes
                            </Button>
                        </Link>
                    </li>
                    )}

                    {haveEvents && (
                        <li className={`flex items-center border-b-shock-color hover:border-b-shock-color hover:border-b-2 h-11 whitespace-nowrap ${path === "/events" && "border-b-2"}`}>
                            <Link href={`/client/${clientSlug}/events`}>
                                <Button className="text-lg" variant="ghost">
                                    Reservas
                                </Button>
                            </Link>
                        </li>
                    )}

                    {
                        haveCRM &&
                        <li className={`flex items-center border-b-shock-color hover:border-b-shock-color hover:border-b-2 h-11 ${path.includes("crm") && "border-b-2"}`}>
                            <Link href={`/client/${clientSlug}/crm`}><Button className="text-lg" variant="ghost">CRM</Button></Link>
                        </li>
                    }
                </ul>
            </nav>
        </div>
    );
}
