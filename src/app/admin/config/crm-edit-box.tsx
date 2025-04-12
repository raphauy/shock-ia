"use client"

import { Switch } from "@/components/ui/switch"
import { setHaveAgentsAction, setHaveCRMAction, setHaveEventsAction, setWapSendFrequencyAction } from "./(crud)/actions"
import { use, useEffect, useState } from "react"
import { Loader, PersonStanding } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { InboxProvider } from "@/lib/generated/prisma"
import { NumberForm } from "@/components/number-form"

interface Props {
    clientId: string
    haveCRM: boolean
    inboxProvider: InboxProvider
    wapSendFrequency: number
}

export default function CRMPropsEdit({ clientId, haveCRM: initialHaveCRM, inboxProvider, wapSendFrequency: initialWapSendFrequency }: Props) {

    const [loadingCRM, setLoadingCRM] = useState(false)
    const [haveCRM, setHaveCRM] = useState(initialHaveCRM)
    const [wapSendFrequency, setWapSendFrequency] = useState(initialWapSendFrequency)

    useEffect(() => {
        setHaveCRM(initialHaveCRM)
    }, [initialHaveCRM])

    useEffect(() => {
        setWapSendFrequency(initialWapSendFrequency)
    }, [initialWapSendFrequency])

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
            <p className="text-lg font-bold mb-4">Configuración del CRM:</p>
            <div>
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
                {
                    haveCRM && (
                        <NumberForm
                            id={clientId}
                            label="Frecuencia de envío de mensajes en campañas (en segundos):"
                            initialValue={wapSendFrequency}
                            fieldName="wapSendFrequency"
                            update={setWapSendFrequencyAction}
                        />
                    )
                }
            </div>
        </div>
    )
}
