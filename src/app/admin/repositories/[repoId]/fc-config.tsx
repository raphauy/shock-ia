import CodeBlock from "@/components/code-block"
import { DescriptionForm } from "@/components/description-form"
import { IconBadge } from "@/components/icon-badge"
import { TitleForm } from "@/components/title-form"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { getComplementaryClients } from "@/services/clientService"
import { getFullRepositoryDAO } from "@/services/repository-services"
import { Briefcase, Database, Sparkles, Tag } from "lucide-react"
import { setAssignToComercialAction, setConversationLLMOffAction, setFinalMessageAction, setFunctionDescriptionAction, setFunctionNameAction, setLLMOffMessageAction, setNameAction, setNotifyPhonesAction, setWebHookUrlAction } from "../repository-actions"
import { DeleteRepositoryDialog } from "../repository-dialogs"
import { ClientSelector, SelectorData } from "./client-selector"
import FieldsBox from "./fields-box"
import FunctionClientBox from "./function-client-box"
import RemoveClientButton from "./remove-client-button"
import SwitchBox from "./switch-box"
import { HookForm } from "./hook-form"
import TagInputFunctionBox from "./tag-input-function"
import SelectStage from "./select-stage"
import { getStagesDAO } from "@/services/stage-services"
import { ClientFunctionTextForm } from "@/components/client-function-text-form"
import { getClientCustomFields } from "@/services/customfield-services"
import { Switch } from "@/components/ui/switch"
import ToggleAssignComercial from "./toggle-assign-comercial"
import { FunctionDescriptionForm } from "./function-description-form"

type Props = {
  clientId?: string
  repoId: string
  fullMode: boolean
  haveCRM: boolean
}

export default async function FCConfig({ clientId, repoId, fullMode, haveCRM }: Props) {

  const repository= await getFullRepositoryDAO(repoId)

  if (!repository) return <div>Repositorio no encontrado</div>

  console.log("clients count", repository.function.clients.length)

  const functionClient= repository.function.clients.find((functionClient) => functionClient.clientId === clientId)

  const clientsIds= repository.function.clients.map((client) => client.clientId)
  const complementaryClients= await getComplementaryClients(clientsIds)
  const selectors: SelectorData[]= complementaryClients.map((client) => ({ id: client.id, name: client.name }))

  const stages= clientId ? await getStagesDAO(clientId) : []
  
  const BASE_PATH= process.env.NEXTAUTH_URL!

  const clientCustomFields= clientId ? await getClientCustomFields(clientId) : []

  return (
    <>
        <div className="p-6 bg-white dark:bg-black mt-4 border rounded-lg w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="min-w-96">
                    <div className="flex items-center space-x-2">
                      <IconBadge icon={Database} />
                      <h2 className="text-xl">
                          Información de la FC
                      </h2>
                    </div>
                    <TitleForm
                      label="Nombre"
                      initialValue={repository.name}
                      id={repository.id}
                      update={setNameAction}                                            
                    />
                    <Separator className="my-7" />


                    <TitleForm
                        label="Nombre de la función"
                        initialValue={repository.functionName}
                        id={repository.id}
                        update={setFunctionNameAction}
                    />
                    
                    <FunctionDescriptionForm repository={repository} />

                    <DescriptionForm
                        label="Respuesta al LLM luego de que esta FC se ejecute"
                        initialValue={repository.finalMessage || ""}
                        id={repository.id}
                        update={setFinalMessageAction}
                    />

                    { fullMode && (
                      <>
                        <Separator className="my-7" />
                        <SwitchBox
                          repoId={repository.id}
                          checked={repository.conversationLLMOff} 
                          switchUpdate={setConversationLLMOffAction}
                          description="Deshabilitar LLM al ejecutar esta función"
                          info= {`Si esta casilla está marcada, cuando se ejecute esta función, se deshabilitará el LLM para la conversaión en cuestión.  \n\nShock IA dejará de responer al usuario aunque se registrarán mensajes entrantes.`}
                        />
                        {
                          repository.conversationLLMOff &&
                          <DescriptionForm
                            label="Mensaje LLM Off"
                            initialValue={repository.llmOffMessage || ""}
                            id={repository.id}
                            update={setLLMOffMessageAction}
                          />
                        }
                      </>
                    )}
                </div>
                <div className="min-w-96">
                    <div className="flex items-center gap-x-2">
                      <IconBadge icon={Tag} />
                      <h2 className="text-xl">
                          Campos de la FC
                      </h2>
                    </div>

                    <div className="mt-6 border bg-slate-100 rounded-md p-2 dark:bg-black">
                      <FieldsBox initialFields={repository.fields} repoId={repository.id} fullMode={true} customFields={clientCustomFields} />
                    </div>

                    <Separator className="my-7" />

                    { 
                      functionClient &&
                      <div className="p-4 bg-muted border rounded-md">
                        <p className="border-b pb-2 font-medium">Hook de notificación:</p>
                        {
                          functionClient.webHookUrl ?
                          <HookForm clientId={functionClient.clientId} functionId={functionClient.functionId} initialValue={functionClient.webHookUrl} update={setWebHookUrlAction} />
                          :
                          <HookForm clientId={functionClient.clientId} functionId={functionClient.functionId} initialValue={"agregar un hook de notificación"} update={setWebHookUrlAction} />
                        }
                      </div>
                    }


                    { 
                      functionClient && haveCRM &&
                      <>
                        <div className="flex items-center gap-x-2 mt-6">
                          <IconBadge icon={Tag} />
                          <h2 className="text-xl">
                              Configuración de CRM
                          </h2>
                        </div>
                        <div className="mt-6">
                          <ClientFunctionTextForm 
                            clientId={functionClient.clientId} 
                            functionId={functionClient.functionId} 
                            label="Teléfonos a notificar cuando se ejecute la FC" 
                            initialValue={functionClient.notifyPhones.join(",")} 
                            update={setNotifyPhonesAction}
                          />
                        </div>
                        <div className="p-4 bg-muted border rounded-md mt-6">
                          <TagInputFunctionBox functionName={repository.functionName} functionClient={functionClient} tagsUI={false} />
                        </div>
                        <div className="p-4 bg-muted border rounded-md mt-6">
                          <p className="font-medium border-b pb-2">Cambiar estado:</p>
                          <SelectStage functionClient={functionClient} stages={stages} />
                        </div>
                        <div className="p-4 bg-muted border rounded-md mt-6 space-y-2">
                          <p className="font-medium border-b pb-2">Asignar Contacto a comercial:</p>
                          <ToggleAssignComercial clientId={functionClient.clientId} functionId={functionClient.functionId} assignToComercial={functionClient.assignToComercial} />
                          <p className="text-sm">Si esta casilla está marcada, cuando se ejecute esta FC, se asignará el Contacto en cuestión a un comercial. Siempre y cuando el Contacto no tenga ya un comercial asignado.</p>
                        </div>
                      </>
                    }


                    { fullMode && (
                      <>
                      <div className="flex items-center gap-x-2">
                        <IconBadge icon={Briefcase} />
                        <h2 className="text-xl">
                            Clientes de esta FC
                        </h2>
                      </div>

                      <div className="mt-6 border bg-slate-100 rounded-md p-2 dark:bg-black space-y-1">
                        {
                          repository.function.clients.length > 0 ?
                          repository.function.clients.map((functionClient) => (
                            <Accordion key={functionClient.clientId} type="single" collapsible className="bg-white rounded-md dark:bg-black px-2 border">
                              <AccordionItem value={functionClient.client.name} className="border-0">
                                <div className="flex items-center">
                                  <div className="flex-grow">
                                    <AccordionTrigger className="w-full">{functionClient.client.name}</AccordionTrigger>
                                  </div>                                
                                  <RemoveClientButton functionId={repository.functionId} clientId={functionClient.clientId} repoId={repository.id} />
                                </div>                              
                                <AccordionContent>
                                  <FunctionClientBox functionClient={functionClient} repoId={repository.id} basePath={BASE_PATH} />
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          ))
                          :
                          <div className="flex items-center justify-center w-full h-full">
                            <p className="text-center">No hay clientes que utilizan este repositorio</p>
                          </div>
                        }
                      </div>

                      <div className="mt-5">
                        <ClientSelector selectors={selectors} functionId={repository.functionId} repoId={repository.id} />
                      </div>
                      </>
                    )}


                </div>
            </div> 
        </div>
        { fullMode && (
          <>
            <div className="p-6 bg-white dark:bg-black mt-4 border rounded-lg w-full">
              <CodeBlock code={repository.function.definition!} showLineNumbers={true} />
            </div>
          </>
        )}
        <div className="flex justify-center w-full mt-10">
          <DeleteRepositoryDialog
            id={repository.id} 
            description={`Seguro que quieres eliminar la FC "${repository.name}"?\n\nHay ${repository.function.clients.length === 1 ? "1 cliente que utiliza" : `${repository.function.clients.length} clientes que utilizan`} la FC "${repository.function.name}".`}
            withText={true}
            clientCount={repository.function.clients.length}
          />
        </div>
    </>
  )
}
