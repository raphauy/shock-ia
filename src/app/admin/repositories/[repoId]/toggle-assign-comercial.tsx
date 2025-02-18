"use client"

import { Switch } from "@/components/ui/switch"
import { setAssignToComercialAction } from "../repository-actions"
import { useState } from "react"
import { Loader } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

type Props= {
    clientId: string
    functionId: string
    assignToComercial: boolean
}

export default function ToggleAssignComercial({ clientId, functionId, assignToComercial }: Props) {

    const [loading, setLoading] = useState(false)

    function handleChange() {
        setLoading(true)
        setAssignToComercialAction(clientId, functionId, !assignToComercial)
        .then(() => {
            toast({ title: "Actualizado" })
        })
        .catch(() => {
            toast({ title: "Error", description: "No se ha podido actualizar", variant: "destructive" })
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return (
        <div className="flex items-center gap-2">
            <Switch checked={assignToComercial} onCheckedChange={handleChange} disabled={loading}/>
            {loading && <Loader className="w-4 h-4 animate-spin" />}
        </div>
    )
}