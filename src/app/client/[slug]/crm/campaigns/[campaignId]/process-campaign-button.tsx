"use client"

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader, Play } from "lucide-react";
import { useState } from "react";
import { processCampaignAction } from "../campaign-actions";

type Props= {
  campaignId: string
}

export default function ProcessCampaignButton({ campaignId }: Props) {
    const [loading, setLoading] = useState(false)

    function handleClick() {
        setLoading(true)
        processCampaignAction(campaignId)
        .then(() => {
            toast({ title: "Campaña procesada correctamente" })
        })
        .catch((error) => {
            toast({ title: "Error al procesar la campaña", variant: "destructive" })
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return (
        <Button onClick={handleClick} disabled={loading} className="w-full gap-2">
            Iniciar campaña <Play className="w-4 h-4" />
            {loading && <Loader className="w-4 h-4 animate-spin" />}
        </Button>
    )
}