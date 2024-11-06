"use client"

import { Switch } from "@/components/ui/switch"
import { setHaveAgentsAction, setHaveCRMAction, setHaveEventsAction } from "./(crud)/actions"
import { use, useEffect, useState } from "react"
import { Loader } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { InboxProvider } from "@prisma/client"

interface Props {
    clientId: string
    haveEvents: boolean
    haveAgents: boolean
    haveCRM: boolean
    inboxProvider: InboxProvider
}

export default function PropsEdit({ clientId, haveEvents: initialHaveEvents, haveAgents: initialHaveAgents, haveCRM: initialHaveCRM, inboxProvider }: Props) {

    const [loadingEvents, setLoadingEvents] = useState(false)
    const [loadingAgents, setLoadingAgents] = useState(false)
    const [loadingCRM, setLoadingCRM] = useState(false)
    const [haveEvents, setHaveEvents] = useState(initialHaveEvents)
    const [haveAgents, setHaveAgents] = useState(initialHaveAgents)
    const [haveCRM, setHaveCRM] = useState(initialHaveCRM)

    useEffect(() => {
        setHaveEvents(initialHaveEvents)
        setHaveAgents(initialHaveAgents)
        setHaveCRM(initialHaveCRM)
    }, [initialHaveEvents, initialHaveAgents, initialHaveCRM])

    function handleHaveEventsChange(haveEvents: boolean) {
        setLoadingEvents(true)
        setHaveEventsAction(clientId, haveEvents)
        .then((res) => {
            if (res) {
                setHaveEvents(haveEvents)
                toast({ title: "Configuración actualizada", description: "La configuración del cliente ha sido actualizada correctamente" })
            } else {
                toast({ title: "Error", description: "Ha ocurrido un error al actualizar la configuración del cliente" })
            }
        })
        .catch(() => {
            toast({
                title: "Error",
                description: "Ha ocurrido un error al actualizar la configuración del cliente"
            })
        })
        .finally(() => {
            setLoadingEvents(false)
        })
    }

    function handleHaveAgentsChange(haveAgents: boolean) {
        setLoadingAgents(true)
        setHaveAgentsAction(clientId, haveAgents)
        .then((res) => {
            if (res) {
                setHaveAgents(haveAgents)
                toast({ title: "Configuración actualizada", description: "La configuración del cliente ha sido actualizada correctamente" })
            } else {
                toast({ title: "Error", description: "Ha ocurrido un error al actualizar la configuración del cliente" })
            }
        })
        .catch(() => {
            toast({
                title: "Error",
                description: "Ha ocurrido un error al actualizar la configuración del cliente"
            })
        })
        .finally(() => {
            setLoadingAgents(false)
        })
    }

    function handleHaveCRMChange(haveCRM: boolean) {
        setLoadingCRM(true)
        setHaveCRMAction(clientId, haveCRM)
        .then((res) => {
            if (res) {
                setHaveCRM(haveCRM)
            }
        })
        .catch(() => {
            toast({
                title: "Error",
                description: "Ha ocurrido un error al actualizar la configuración del cliente"
            })
        })
        .finally(() => {
            setLoadingCRM(false)
        })
    }

    return (
        <div className="w-full p-4 border rounded-lg space-y-4">
            <p className="text-lg font-bold mb-4">Configuración del cliente:</p>
            <div className="flex items-center gap-4">                
                {
                    loadingEvents ? <Loader className="w-4 h-4 mr-2 animate-spin" /> :
                    <Switch checked={haveEvents} onCheckedChange={handleHaveEventsChange} />
                }
                <p className="">Eventos y Reservas</p>
            </div>
            <div className="flex items-center gap-4">                
                {
                    loadingAgents ? <Loader className="w-4 h-4 mr-2 animate-spin" /> :
                    <Switch checked={haveAgents} onCheckedChange={handleHaveAgentsChange} disabled={inboxProvider !== InboxProvider.CHATWOOT} />
                }
                <p className="">Agentes (perfil cliente)</p>
                {
                    inboxProvider !== InboxProvider.CHATWOOT && (
                        <p className="text-sm text-gray-500">
                            Disponible para clientes con el proveedor CHATWOOT.
                        </p>
                    )
                }
            </div>
            <div className="flex items-center gap-4">                
                {
                    loadingCRM ? <Loader className="w-4 h-4 mr-2 animate-spin" /> :
                    <Switch checked={haveCRM} onCheckedChange={handleHaveCRMChange} disabled={inboxProvider !== InboxProvider.CHATWOOT} />
                }
                <p className="">CRM</p>
                {
                    inboxProvider !== InboxProvider.CHATWOOT && (
                        <p className="text-sm text-gray-500">
                            Disponible para clientes con el proveedor CHATWOOT.
                        </p>
                    )
                }
            </div>
        </div>
    )
}
