"use client"

import { useEffect, useState } from "react"
import SimpleCopyHook from "./simple-copy-hook"
import { useSearchParams } from "next/navigation"
import useCopyToClipboard from "@/lib/useCopyToClipboard"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

interface Props {
    basePath: string
    apiToken: string
}

export default function ContactsHook({ basePath, apiToken }: Props) {

    const [value, copy] = useCopyToClipboard()
    const [apiTokenValue, setApiTokenValue] = useState(apiToken)

    const [clientId, setClientId]= useState("") 

    const searchParams= useSearchParams()
    useEffect(() => {
        const clientId= searchParams.get("clientId") || ""
        setClientId(clientId)
        
    }, [searchParams])

    if (!clientId) return null

    function copyApiTokenToClipboard(){   
        copy(apiTokenValue)    
        toast({title: "API token copiado" })
    }

    return (
        <div className="w-full p-4 mt-2 border rounded-lg">
            <p className="text-2xl font-bold">CRM</p>
            <SimpleCopyHook name="createContacts" path={`${basePath}/api/${clientId}/crm/contacts`} />
            <SimpleCopyHook name="sendMessage" path={`${basePath}/api/${clientId}/crm/message`} />

            <div className="flex items-end gap-4 pb-3 mb-3 border-b mt-10">
                <p className="mt-5"><strong>API token (Bearer)</strong>: {apiTokenValue}</p>
                <Button variant="ghost" className="p-1 h-7"><Copy onClick={copyApiTokenToClipboard} /></Button>
            </div>
        </div>
    )
}
