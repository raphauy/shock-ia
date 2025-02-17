"use client"

import { ComercialDAO } from "@/services/comercial-services"
import { ContactDAO } from "@/services/contact-services"
import { useEffect, useState } from "react"
import { getActiveComercialsDAOAction } from "../comercials/comercial-actions"
import { BriefcaseBusiness, Loader } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { asignarContactoAction } from "./contact-actions"

type Props = {
  contact: ContactDAO
}

export function ComercialSelector({ contact }: Props) {
    const [loading, setLoading] = useState(false)
    const [comercial, setComercial] = useState<ComercialDAO | null>(null)
    const [comercials, setComercials] = useState<ComercialDAO[]>([])

    useEffect(() => {
        getActiveComercialsDAOAction(contact.clientId)
        .then(respComercials => {
        setComercials(respComercials)
        })
        if (contact.comercialId) {
            setComercial(comercials.find(comercial => comercial.id === contact.comercialId) || null)
        }
    }, [contact, comercials])

    async function handleComercialChange(comercialId: string) {
        setLoading(true)
        await asignarContactoAction(contact.id, comercialId)
        setComercial(comercials.find(comercial => comercial.id === comercialId) || null)
        setLoading(false)
    }

    if (comercial) {
        return (
            <div className="flex items-center gap-2">
                <div><BriefcaseBusiness className="h-5 w-5" /></div>
                <p>{comercial?.user.name}</p>
            </div>
        )
    }

    if (comercials.length === 0) {
        return null
    }

    return (
            <div className="flex items-center gap-2 min-w-[200px]">
                <div>
                    {loading ? <Loader className="h-5 w-5 animate-spin" /> : <BriefcaseBusiness className="h-5 w-5" />}
                </div>
                <Select onValueChange={handleComercialChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Asignar comercial" />
                    </SelectTrigger>
                    <SelectContent>
                        {comercials.map(comercial => (
                            <SelectItem key={comercial.id} value={comercial.id}>{comercial.user.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )
}