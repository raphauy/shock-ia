"use client"

import { NumberForm } from "@/components/number-form"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { InboxProvider } from "@/lib/generated/prisma"
import { Loader, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { setAutoUpdateInactiveConversationsAction, setHaveCRMAction, setWapSendFrequencyAction, setChatwootWidgetTokenAction } from "./(crud)/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Props {
    clientId: string
    haveCRM: boolean
    inboxProvider: InboxProvider
    wapSendFrequency: number
    autoUpdateInactiveConversations: boolean
    chatwootWidgetToken?: string
    widgetUrl: string
}

export default function CRMPropsEdit({ 
    clientId, 
    haveCRM: initialHaveCRM, 
    inboxProvider, 
    wapSendFrequency: initialWapSendFrequency,
    autoUpdateInactiveConversations: initialAutoUpdateInactiveConversations = false,
    chatwootWidgetToken: initialChatwootWidgetToken = "",
    widgetUrl: initialWidgetUrl = ""
}: Props) {

    const [loadingCRM, setLoadingCRM] = useState(false)
    const [loadingUpdateConversations, setLoadingUpdateConversations] = useState(false)
    const [loadingWidgetToken, setLoadingWidgetToken] = useState(false)
    const [haveCRM, setHaveCRM] = useState(initialHaveCRM)
    const [wapSendFrequency, setWapSendFrequency] = useState(initialWapSendFrequency)
    const [autoUpdateInactiveConversations, setAutoUpdateInactiveConversations] = useState(initialAutoUpdateInactiveConversations)
    const [chatwootWidgetToken, setChatwootWidgetToken] = useState(initialChatwootWidgetToken || "")

    useEffect(() => {
        setHaveCRM(initialHaveCRM)
    }, [initialHaveCRM])

    useEffect(() => {
        setWapSendFrequency(initialWapSendFrequency)
    }, [initialWapSendFrequency])

    useEffect(() => {
        setAutoUpdateInactiveConversations(initialAutoUpdateInactiveConversations)
    }, [initialAutoUpdateInactiveConversations])

    useEffect(() => {
        setChatwootWidgetToken(initialChatwootWidgetToken || "")
    }, [initialChatwootWidgetToken])

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

    function handleAutoUpdateInactiveConversationsChange(autoUpdate: boolean) {
        setLoadingUpdateConversations(true)
        setAutoUpdateInactiveConversationsAction(clientId, autoUpdate)
        .then((res) => {
            if (res) {
                setAutoUpdateInactiveConversations(autoUpdate)
                toast({
                    title: autoUpdate ? "Actualización automática activada" : "Actualización automática desactivada",
                    description: autoUpdate 
                        ? "Las conversaciones inactivas se actualizarán automáticamente a 'pendientes'" 
                        : "Las conversaciones inactivas no se actualizarán automáticamente"
                })
            }
        })
        .catch((error) => {
            toast({
                title: "Error",
                description: "Ha ocurrido un error al actualizar la configuración de actualización automática"
            })
        })
        .finally(() => {
            setLoadingUpdateConversations(false)
        })
    }

    function handleChatwootWidgetTokenChange() {
        setLoadingWidgetToken(true)
        setChatwootWidgetTokenAction(clientId, chatwootWidgetToken)
        .then((res) => {
            if (res) {
                toast({
                    title: "ID de Widget actualizado",
                    description: "El ID del widget de Chatwoot ha sido actualizado correctamente"
                })
            }
        })
        .catch((error) => {
            toast({
                title: "Error",
                description: "Ha ocurrido un error al actualizar el ID del widget de Chatwoot"
            })
        })
        .finally(() => {
            setLoadingWidgetToken(false)
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
                        <div className="space-y-4 mt-4">
                            <NumberForm
                                id={clientId}
                                label="Frecuencia de envío de mensajes en campañas (en segundos):"
                                initialValue={wapSendFrequency}
                                fieldName="wapSendFrequency"
                                update={setWapSendFrequencyAction}
                            />
                            
                            <div className="flex items-center gap-4 mt-4">
                                {
                                    loadingUpdateConversations ? <Loader className="w-4 h-4 mr-2 animate-spin" /> :
                                    <Switch 
                                        checked={autoUpdateInactiveConversations} 
                                        onCheckedChange={handleAutoUpdateInactiveConversationsChange} 
                                    />
                                }
                                <div className="text-sm text-muted-foreground">
                                    <p className="font-bold text-lg">Actualizar automáticamente conversaciones inactivas de Chatwoot</p>
                                    <p>
                                        Las conversaciones inactivas por 24h y que tienen estado &apos;open&apos; se marcarán como pendientes automáticamente
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1 mt-4">
                                <Label htmlFor="chatwootWidgetToken">Token del widget de Chatwoot:</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="chatwootWidgetToken"
                                        value={chatwootWidgetToken}
                                        onChange={(e) => setChatwootWidgetToken(e.target.value)}
                                        placeholder="Ingrese el token del widget de Chatwoot"
                                        className="flex-1"
                                    />
                                    <Button 
                                        onClick={handleChatwootWidgetTokenChange} 
                                        disabled={loadingWidgetToken}
                                    >
                                        {loadingWidgetToken ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Guardar token
                                    </Button>
                                </div>
                                {
                                    initialChatwootWidgetToken && (
                                        <Link href={initialWidgetUrl} target="_blank">
                                            <Button variant="link" className="px-0">{initialWidgetUrl}</Button>
                                        </Link>
                                    )
                                }
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    )
}
