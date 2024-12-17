"use client"

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader, X } from "lucide-react";
import { useState } from "react";
import { cancelCampaignAction } from "../campaign-actions";

type Props= {
  campaignId: string
}

export default function CancelCampaignButton({ campaignId }: Props) {
    const [loading, setLoading] = useState(false)

    function handleClick() {
        setLoading(true)
        cancelCampaignAction(campaignId)
        .then(() => {
            toast({ title: "Campaña cancelada correctamente" })
        })
        .catch((error) => {
            toast({ title: "Error al procesar la campaña", variant: "destructive" })
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return (
        <Button onClick={handleClick} variant="destructive" disabled={loading} className="w-full gap-2">
            Detener campaña <X className="w-4 h-4" />
            {loading && <Loader className="w-4 h-4 animate-spin" />}
        </Button>
    )
}