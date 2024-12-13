"use client"

import { Button } from "@/components/ui/button"
import { processCampaignContactAction } from "../campaign-actions"
import { Loader, Play } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useState } from "react"

type Props = {
    campaignContactId: string
}

export function ProcessCampaignContactButton({ campaignContactId }: Props) {
    const [loading, setLoading] = useState(false)

    function handleClick() {
        setLoading(true)
        processCampaignContactAction(campaignContactId)
        .then((res) => {
            if (res) {
                toast({ title: "Mensaje enviado correctamente" })
            } else {
                toast({ title: "Error al enviar el mensaje", variant: "destructive" })
            }
        })
        .catch((error) => {
            toast({
                title: "Error al enviar el mensaje",
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
                loading ? <Loader className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>
            }
        </Button>
    )
}