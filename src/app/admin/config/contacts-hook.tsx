"use client"

import { useEffect, useState } from "react"
import SimpleCopyHook from "./simple-copy-hook"
import { useSearchParams } from "next/navigation"
import useCopyToClipboard from "@/lib/useCopyToClipboard"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import CodeBlock from "@/components/code-block"

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
            
            <div className="flex items-center gap-4">
                <SimpleCopyHook name="sendMessage" path={`${basePath}/api/${clientId}/crm/message`} />
                <ExampleDialog />
            </div>

            <div className="flex items-end gap-4 pb-3 mb-3 border-b mt-10">
                <p className="mt-5"><strong>API token (Bearer)</strong>: {apiTokenValue}</p>
                <Button variant="ghost" className="p-1 h-7"><Copy onClick={copyApiTokenToClipboard} /></Button>
            </div>
        </div>
    )
}


export function ExampleDialog() {
    const curlCommand = `curl -X POST "https://local.rctracker.dev/api/clsnvcntc003okaqc2gfrme4b/crm/message" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer 15d97755-daf0-4ab2-9d7c-23258384fd22" \\
  -d '{
    "contact": {
      "name": "Juan Pérez",
      "phone": "+59899123456"
    },
    "customFields": {
      "Origen": "Landing Page",
      "Email": "juan@perez.com",
      "Ciudad": "Artigas",
      "Modelo": "https://www.volvocars.com/uy/cars/ex30-electric/",
      "Comentario": "Este es un comentario de prueba"
    },
    "message": "Hola, esto es una prueba vía API."
  }'`;

    const [value, copy] = useCopyToClipboard()

    const copyToClipboard = () => {
        copy(curlCommand)
        toast({title: "Curl copiado!"})
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" className="mt-5">Ver ejemplo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Ejemplo de Integración</DialogTitle>
                    <DialogDescription>
                        Este es un ejemplo de cómo enviar un mensaje y crear un contacto simultáneamente.
                    </DialogDescription>
                </DialogHeader>
                <div className="w-fit">
                    <CodeBlock code={curlCommand} showLineNumbers={false} />
                </div>
                <Button onClick={copyToClipboard} className='w-full gap-2'>
                    <Copy />
                    <p>Copiar Comando Curl</p>
                </Button>
            </DialogContent>
        </Dialog>
    )
}
  