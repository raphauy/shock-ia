"use client"

import { Switch } from "@/components/ui/switch"
import { setHaveEventsAction } from "./(crud)/actions"

interface Props {
    clientId: string
    haveEvents: boolean
}

export default function PropsEdit({ clientId, haveEvents }: Props) {

    function handleHaveEventsChange(haveEvents: boolean) {
        setHaveEventsAction(clientId, haveEvents)
    }

    return (
        <div className="w-full p-4 border rounded-lg">
            <p className="text-lg font-bold mb-4">Configuración del cliente:</p>
            <div className="flex items-center gap-4">                
                <Switch checked={haveEvents} onCheckedChange={handleHaveEventsChange} disabled={true}/>
                <p className="">Funcionalidad Eventos</p>
            </div>
        </div>
    )
}
