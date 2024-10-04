"use client"

import { Button } from "@/components/ui/button";
import { Loader, Plus } from "lucide-react";
import { createInstanceAction } from "./actions";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";

type Props = {
    name: string
}
export default function CreateInstanceButton({ name }: Props) {
    const [loading, setLoading] = useState(false)

    function handleClick() {
        setLoading(true)
        createInstanceAction(name)
        .then(() => {
            toast({title: "Conexión creada, procesando..." })
        })
        .catch((error) => {
            toast({title: "Error", description: "Error al crear la conexión", variant: "destructive" })
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return (
        <Button className="" onClick={handleClick}>
            {loading ? <Loader className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Crear conexión
        </Button>
    )
}