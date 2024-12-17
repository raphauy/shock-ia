"use client"

import { Button } from "@/components/ui/button"
import { deleteScheduledCampaignContactAction } from "../campaign-actions"
import { Loader, Play, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useState } from "react"

type Props = {
    campaignContactId: string
}

export function DeleteScheduledCampaignContactButton({ campaignContactId }: Props) {
    const [loading, setLoading] = useState(false)

    function handleClick() {
        setLoading(true)
        deleteScheduledCampaignContactAction(campaignContactId)
        .then((res) => {
            if (res) {
                toast({ title: "Mensaje cancelado correctamente" })
            } else {
                toast({ title: "Error al cancelar el mensaje", variant: "destructive" })
            }
        })
        .catch((error) => {
            toast({
                title: "Error al cancelar el mensaje",
                variant: "destructive"
            })
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return (
        <Button variant="ghost" onClick={handleClick}>
            {
                loading ? <Loader className="w-4 h-4 animate-spin"/> : <X className="w-4 h-4"/>
            }
        </Button>
    )
}