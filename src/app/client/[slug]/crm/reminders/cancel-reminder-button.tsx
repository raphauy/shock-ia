"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader, MessageCircleOff } from "lucide-react"
import { useState } from "react"
import { cancelReminderAction } from "./reminder-actions"

type Props = {
    reminderId: string
}

export function CancelReminderButton({ reminderId }: Props) {
    const [loading, setLoading] = useState(false)

    function handleClick() {
        setLoading(true)
        cancelReminderAction    (reminderId)
        .then((res) => {
            if (res) {
                toast({ title: "Recordatorio cancelado correctamente" })
            } else {
                toast({ title: "Error al cancelar el recordatorio", variant: "destructive" })
            }
        })
        .catch((error) => {
            toast({
                title: "Error al cancelar el recordatorio",
                variant: "destructive"
            })
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return (
        <Button variant="ghost" onClick={handleClick} className="px-0">
            {
                loading ? <Loader className="w-4 h-4 animate-spin"/> : <MessageCircleOff className="w-4 h-4 text-red-500"/>
            }
        </Button>
    )
}