"use client"

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { useState } from "react";
import { addContactsToCampaignAction } from "../campaign-actions";

type Props= {
  campaignId: string
  contactsIds: string[]
}

export default function SetContactsButton({ campaignId, contactsIds }: Props) {

    const [loading, setLoading] = useState(false)

    function handleClick() {
        setLoading(true)
        addContactsToCampaignAction(campaignId, contactsIds)
        .then(() => {
            toast({ title: "Contactos seleccionados" })
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
        <Button onClick={handleClick} disabled={loading} className="w-full gap-2">
            Seleccionar estos {contactsIds.length} contactos para esta campaña
            {loading && <Loader className="w-4 h-4 animate-spin" />}
        </Button>
    )
}