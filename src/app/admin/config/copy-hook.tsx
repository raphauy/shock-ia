"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import useCopyToClipboard from "@/lib/useCopyToClipboard"
import { cn } from "@/lib/utils"
import { Copy } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

interface Props {
    name: string
    path: string
    clientId: string
}

export default function CopyHook({ name, path, clientId }: Props) {

    const [value, copy] = useCopyToClipboard()
    const [hook, setHook] = useState(path)

    const searchParams= useSearchParams()
    const visible= searchParams.get("clientId") === clientId || clientId === "all"

    function copyHookToClipboard(){   
        copy(hook)    
        toast({title: "Hook copiado" })
    }

    return (
        <div className={cn("w-full p-4 mt-2 border rounded-lg", visible ? "block" : "hidden")}>
            <div className="flex items-end gap-4 pb-3 mb-3 border-b">
                <p className="mt-5"><strong>{name}</strong>: {hook}</p>
                <Button variant="ghost" className="p-1 h-7"><Copy onClick={copyHookToClipboard} /></Button>
            </div>
        </div>
    )
}
