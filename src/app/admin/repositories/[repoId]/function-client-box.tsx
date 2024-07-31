"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import useCopyToClipboard from "@/lib/useCopyToClipboard"
import { FunctionClientDAO } from "@/services/function-services"
import { Copy } from "lucide-react"
import { setWebHookUrlAction } from "../repository-actions"
import { CurlTestDialog } from "./curl-test"
import { HookForm } from "./hook-form"

type Props= {
    repoId: string
    functionClient: FunctionClientDAO
    basePath: string
}
export default function FunctionClientBox({ repoId, functionClient, basePath }: Props) {
  const [value, copy] = useCopyToClipboard()
  const endpoint= `${basePath}/api/${functionClient.client.id}/repo-data/${repoId}`

  const [llmOnValue, llmOnCopy] = useCopyToClipboard()
  const llmOnEndpoint= `${basePath}/api/${functionClient.client.id}/repo-data/${repoId}/llm-on`
  
  function copyHookToClipboard(){   
    copy(endpoint)    
    toast({title: "Endpoint copiado" })
  }

  function copyLlmOnToClipboard(){   
    llmOnCopy(llmOnEndpoint)    
    toast({title: "Endpoint copiado" })
  }

  return (
    <div className="grid gap-2 pl-6">
      <div>
        <p className="font-bold">Data API: </p>
        <div className="flex items-center justify-between">
          <p className="truncate lg:max-w-[200px] xl:max-w-xs">{endpoint}</p>
          <div className="flex items-center gap-2">
            <CurlTestDialog endpoint={endpoint} />
            <Button variant="ghost" className="p-1 h-7"><Copy onClick={copyHookToClipboard} /></Button>            
          </div>
          
        </div>
      </div>
      <div>
        <p className="font-bold">LLM ON API: </p>
        <div className="flex items-center justify-between">
          <p className="truncate lg:max-w-[200px] xl:max-w-xs">{llmOnEndpoint}</p>
          <div className="flex items-center gap-2">
            <CurlTestDialog endpoint={llmOnEndpoint} />
            <Button variant="ghost" className="p-1 h-7"><Copy onClick={copyLlmOnToClipboard} /></Button>
          </div>
          
        </div>
      </div>
      <div>
        <p className="font-bold">Hook de notificación:</p>
        {
          functionClient.webHookUrl ?
          <HookForm clientId={functionClient.clientId} functionId={functionClient.functionId} initialValue={functionClient.webHookUrl} update={setWebHookUrlAction} />
          :
          <HookForm clientId={functionClient.clientId} functionId={functionClient.functionId} initialValue={"agregar un hook de notificación"} update={setWebHookUrlAction} />
        }
      </div>
    </div>
)
}
