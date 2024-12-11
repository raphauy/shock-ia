"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Loader } from "lucide-react"
import { useState } from "react"
import { removeAllContactsFromCampaignAction } from "../campaign-actions"

export default function RemoveAllContactsButton({ campaignId }: { campaignId: string }) {

    const [loading, setLoading] = useState(false)

    function handleClick() {
        setLoading(true)
        removeAllContactsFromCampaignAction(campaignId)
        .then(() => {
            toast({ title: "Contactos eliminados" })
        })
        .catch((error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            })
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return (
        <Button variant="outline" onClick={handleClick} disabled={loading} className="gap-2">
            Quitar todos los contactos de esta campaña
            {loading && <Loader className="w-4 h-4 animate-spin" />}
        </Button>
    )
}