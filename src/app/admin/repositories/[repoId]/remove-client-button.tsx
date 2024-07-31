"use client"

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader, X } from "lucide-react";
import { useState } from "react";
import { removeFunctionFromClientAction } from "../repository-actions";

type Props= {
    functionId: string
    clientId: string
    repoId: string
}
export default function RemoveClientButton({ functionId, clientId, repoId }: Props) {

    const [loading, setLoading] = useState(false)

    function handleRemoveFunction() {
        setLoading(true)
        console.log("handleRemoveFunction")
        console.log("clientId: ", clientId)
        console.log("functionId: ", functionId)
        removeFunctionFromClientAction(clientId, functionId, repoId)
        .then(() => {
            toast({ title: "Cliente quitado" })
        })
        .catch((error) => {
            console.log(error)
            toast({ title: "Error al quitar cliente", description: error.message, variant: "destructive" })
        })
        .finally(() => {
            setLoading(false)
        })
    }
    return (
        <div>
            <Button variant="ghost" className="px-1" onClick={handleRemoveFunction}>
                {
                    loading ? 
                    <Loader className="w-5 h-5 animate-spin" /> :
                    <X className="w-5 h-5 text-red-500" />
                }
            </Button>
        </div>
    );
}