"use client"

import { Button } from "@/components/ui/button";
import { Loader, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getRemainingCountAction } from "../campaign-actions";
import { toast } from "@/components/ui/use-toast";
import { cancelCampaignAction } from "../campaign-actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Props= {
    campaignId: string
}

export default function CancelCampaignButton({ campaignId }: Props) {
    const [loading, setLoading] = useState(false)
    const [remainingCount, setRemainingCount] = useState(0)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        getRemainingCountAction(campaignId)
        .then((count) => {
            setRemainingCount(count)
        })
    }, [campaignId])

    function handleCancel() {
        console.log("cancelando campaña", campaignId)
        setLoading(true)
        cancelCampaignAction(campaignId)
        .then(() => {
            toast({ title: "Campaña cancelada correctamente" })
            setOpen(false)
        })
        .catch((error) => {
            toast({ title: "Error al procesar la campaña", variant: "destructive" })
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                    <X className="w-4 h-4" /> Detener campaña (quedan {remainingCount} contactos por enviar)
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>¿Detener campaña?</DialogTitle>
                    <DialogDescription>
                        Se cancelará el envío de {remainingCount} contactos que aún están programados. Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleCancel} disabled={loading}>
                        {loading && <Loader className="w-4 h-4 animate-spin mr-2" />}
                        Detener
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}