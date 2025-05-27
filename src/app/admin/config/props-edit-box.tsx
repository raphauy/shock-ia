"use client"

import { Switch } from "@/components/ui/switch"
import { setHaveAgentsAction, setHaveAudioResponseAction, setHaveCRMAction, setHaveEventsAction, setV2EnabledAction } from "./(crud)/actions"
import { use, useEffect, useState } from "react"
import { Loader } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { InboxProvider } from "@/lib/generated/prisma"

interface Props {
    clientId: string
    haveEvents: boolean
    haveAgents: boolean
    haveAudioResponse: boolean
    inboxProvider: InboxProvider
    v2Enabled: boolean
}

export default function PropsEdit({ 
    clientId, 
    haveEvents: initialHaveEvents, 
    haveAgents: initialHaveAgents, 
    haveAudioResponse: initialHaveAudioResponse,
    inboxProvider,
    v2Enabled: initialV2Enabled
}: Props) {

    const [loadingEvents, setLoadingEvents] = useState(false)
    const [loadingAgents, setLoadingAgents] = useState(false)
    const [loadingAudioResponse, setLoadingAudioResponse] = useState(false)
    const [loadingV2Enabled, setLoadingV2Enabled] = useState(false)
    const [haveEvents, setHaveEvents] = useState(initialHaveEvents)
    const [haveAgents, setHaveAgents] = useState(initialHaveAgents)
    const [haveAudioResponse, setHaveAudioResponse] = useState(initialHaveAudioResponse)
    const [v2Enabled, setV2Enabled] = useState(initialV2Enabled)
    useEffect(() => {
        setHaveEvents(initialHaveEvents)
        setHaveAgents(initialHaveAgents)
        setHaveAudioResponse(initialHaveAudioResponse)
        setV2Enabled(initialV2Enabled)
    }, [initialHaveEvents, initialHaveAgents, initialHaveAudioResponse, initialV2Enabled])

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

    function handleHaveAudioResponseChange(haveAudioResponse: boolean) {
        setLoadingAudioResponse(true)
        setHaveAudioResponseAction(clientId, haveAudioResponse)
        .then((res) => {
            if (res) {
                setHaveAudioResponse(haveAudioResponse)
                toast({ title: "Configuración actualizada", description: "La configuración del cliente ha sido actualizada correctamente" })
            }
        })
        .catch(() => {
            toast({
                title: "Error",
                description: "Ha ocurrido un error al actualizar la configuración del cliente"
            })
        })
        .finally(() => {
            setLoadingAudioResponse(false)
        })
    }

    function handleV2EnabledChange(v2Enabled: boolean) {
        setLoadingV2Enabled(true)
        setV2EnabledAction(clientId, v2Enabled)
        .then((res) => {
            if (res) {
                setV2Enabled(v2Enabled)
                toast({ title: "Configuración actualizada", description: "La configuración del cliente ha sido actualizada correctamente" })
            }
        })
        .catch(() => {
            toast({
                title: "Error",
                description: "Ha ocurrido un error al actualizar la configuración del cliente"
            })
        })
        .finally(() => {
            setLoadingV2Enabled(false)
        })
    }

    return (
        <div className="w-full p-4 border rounded-lg space-y-4">
            <p className="text-lg font-bold mb-4">Configuración general:</p>
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
                        <p className="text-sm italic">
                            - Disponible para clientes con el proveedor CHATWOOT.
                        </p>
                    )
                }
            </div>
            <div className="flex items-center gap-4">                
                {
                    loadingAudioResponse ? <Loader className="w-4 h-4 mr-2 animate-spin" /> :
                    <Switch checked={haveAudioResponse} onCheckedChange={handleHaveAudioResponseChange} disabled={inboxProvider !== InboxProvider.CHATWOOT} />
                }
                <p className="">Responder audio con audio</p>
                {
                    inboxProvider !== InboxProvider.CHATWOOT && (
                        <p className="text-sm italic">
                            - Disponible para clientes con el proveedor CHATWOOT.
                        </p>
                    )
                }
            </div>
            <div className="flex items-center gap-4">                
                {
                    loadingV2Enabled ? <Loader className="w-4 h-4 mr-2 animate-spin" /> :
                    <Switch checked={v2Enabled} onCheckedChange={handleV2EnabledChange} />
                }
                <p className="">Simulador Pro (V2)</p>
            </div>
        </div>
    )
}
