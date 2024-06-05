"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import useCopyToClipboard from "@/lib/useCopyToClipboard"
import { Copy } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

interface Props {
    name: string
    path: string
}

export default function SimpleCopyHook({ name, path }: Props) {

    const [value, copy] = useCopyToClipboard()
    const [hook, setHook] = useState(path)

    function copyHookToClipboard(){   
        copy(hook)    
        toast({title: "Hook copiado" })
    }

    useEffect(() => {
        setHook(path)
        
    }, [path])
    

    return (
        <div className="flex items-end gap-4">
            <p className="mt-5"><strong>{name}</strong>: {hook}</p>
            <Button variant="ghost" className="p-1 h-7"><Copy onClick={copyHookToClipboard} /></Button>
        </div>
)
}
