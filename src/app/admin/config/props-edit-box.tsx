"use client"

import { Switch } from "@/components/ui/switch"
import { setHaveEventsAction } from "./(crud)/actions"
import { useState } from "react"
import { Loader } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Props {
    clientId: string
    haveEvents: boolean
}

export default function PropsEdit({ clientId, haveEvents: initialHaveEvents }: Props) {

    const [loading, setLoading] = useState(false)
    const [haveEvents, setHaveEvents] = useState(initialHaveEvents)

    function handleHaveEventsChange(haveEvents: boolean) {
        setLoading(true)
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
            setLoading(false)
        })
    }

    return (
        <div className="w-full p-4 border rounded-lg">
            <p className="text-lg font-bold mb-4">Configuración del cliente:</p>
            <div className="flex items-center gap-4">                
                {
                    loading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> :
                    <Switch checked={haveEvents} onCheckedChange={handleHaveEventsChange} />
                }
                <p className="">Funcionalidad Eventos</p>
            </div>
        </div>
    )
}
