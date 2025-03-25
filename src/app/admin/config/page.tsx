import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientSelector, SelectorData } from "../client-selector"
import { getDataClients, updatePrompt, updateWhatsAppNumbersAction } from "../clients/(crud)/actions"
import { ClientFunctionsBox } from "../clients/(crud)/client-dialog"
import ConfigsPage from "../configs/page"
import { PromptForm } from "../prompts/prompt-form"
import Hook from "./hook"
import TokensPrice from "./tokens-price"
import CopyHook from "./copy-hook"
import { getClientBySlug, getFunctionsOfClient } from "@/services/clientService"
import DocumentsHook from "./documents-hook"
import { WhatsappNumbersForm } from "./whatsapp-numbers-form"
import RegistrosHook from "./registros-hook"
import PropsEdit from "./props-edit-box"
import ProviderSelector from "./whatsapp/provider-selector"
import WhatsappTab from "./whatsapp/whatsapp-tab"
import FCTab from "./fc-tab"
import { getReposOfClient } from "@/services/repository-services"
import CRMPropsEdit from "./crm-edit-box"
import ContactsHook from "./contacts-hook"
import { FCPanel } from "./fc-panel"
import { getGenericFunctions } from "@/services/function-services"
import { Separator } from "@/components/ui/separator"
import { getCurrentUser } from "@/lib/auth"
import PromptVersionManager from "@/app/client/[slug]/prompt/prompt-version-manager"
import { getPromptVersionsDAO } from "@/services/prompt-version-services"
import ProductsConfig from "./products-config"

// Configuración para extender el tiempo máximo de ejecución
export const maxDuration = 800; // 800 segundos (máximo para plan Pro con Fluid Compute)

type Props = {
    searchParams: {
        clientId: string
        fcId: string
    }
}
export default async function ConfigPage({ searchParams }: Props) {

    const user= await getCurrentUser()
    if (!user) return <div>No hay usuario logueado</div>
    const isSuperAdmin= user.email === "rapha.uy@rapha.uy"

    const clientId= searchParams.clientId

    const clients= await getDataClients()
    const client= clients.find((client) => client.id === clientId)
    if (!client) return <div>No hay clientes</div>
    const selectors: SelectorData[]= clients.map((client) => ({ slug: client.id, name: client.nombre }))
    const narvaezClient= await getClientBySlug("narvaez")
    const summitClient= await getClientBySlug("summit")
    const functionsOfClient= await getFunctionsOfClient(clientId)
    const haveCarServiceFunction= functionsOfClient.find((f) => f.name === "reservarServicio") !== undefined

    const genericFunctions= await getGenericFunctions()
    const BASE_PATH= process.env.NEXTAUTH_URL || "NOT-CONFIGURED"

    const versions= await getPromptVersionsDAO(clientId)

    return (
        <div className="flex flex-col items-center w-full p-5 gap-7">
            <Tabs defaultValue="prompt" className="min-w-[700px] xl:min-w-[1000px]">
                <TabsList className="flex justify-between w-full h-12 mb-8">
                    <ClientSelector selectors={selectors} />
                    <div>
                        <TabsTrigger value="prompt">Prompt</TabsTrigger>
                        <TabsTrigger value="functions">Funciones</TabsTrigger>
                        <TabsTrigger value="props">Config</TabsTrigger>
                        <TabsTrigger value="hooks">Hooks</TabsTrigger>                        
                        <TabsTrigger value="whatsapp">Whatsapp</TabsTrigger>                        
                        <TabsTrigger value="general">General</TabsTrigger>
                    </div>
                </TabsList>
                <TabsContent value="prompt">
                    <PromptVersionManager clientId={client.id} prompt={client.prompt || ""} versions={versions} timezone={client.timezone}/>    
                </TabsContent>
                <TabsContent value="functions">
                    { client.haveCRM ?
                        <FCPanel clientId={client.id} haveCRM={client.haveCRM} haveProducts={client.haveProducts} genericFunctions={genericFunctions} functionsOfClient={functionsOfClient} /> :
                        <ClientFunctionsBox clientId={client.id} />
                    }

                    <FCTab client={client} searchParams={searchParams} />
                    <Separator className="my-4" />
                    { client.haveCRM && isSuperAdmin && <ClientFunctionsBox clientId={client.id} />}
                </TabsContent>
                <TabsContent value="props" className="space-y-6">
                    <PropsEdit clientId={client.id} haveEvents={client.haveEvents} haveAgents={client.haveAgents} haveAudioResponse={client.haveAudioResponse} inboxProvider={client.inboxProvider} />
                    <CRMPropsEdit clientId={client.id} haveCRM={client.haveCRM} inboxProvider={client.inboxProvider} wapSendFrequency={client.wapSendFrequency} />
                    <ProductsConfig clientId={client.id} haveProducts={client.haveProducts} />
                    <WhatsappNumbersForm id={client.id} update={updateWhatsAppNumbersAction} whatsappNumbers={client.whatsappNumbers} />
                    <TokensPrice clientId={client.id} promptTokensPrice={client.promptTokensPrice} completionTokensPrice={client.completionTokensPrice} />
                </TabsContent>
                <TabsContent value="hooks">
                    <Hook basePath={BASE_PATH} />
                    <DocumentsHook basePath={BASE_PATH} />
                    <CopyHook name="Narvaez Entry" path={`${BASE_PATH}/api/${narvaezClient?.id}/narvaez`} clientId={narvaezClient?.id || ""} />
                    <CopyHook name="Summit Entry" path={`${BASE_PATH}/api/${summitClient?.id}/summit`} clientId={summitClient?.id || ""} />
                    { haveCarServiceFunction && 
                        <CopyHook name="Car Service Entry" path={`${BASE_PATH}/api/${client.id}/car-service`} clientId={client.id} />
                    }
                    <RegistrosHook basePath={BASE_PATH} />
                    {
                        client.haveCRM &&
                        <ContactsHook basePath={BASE_PATH} apiToken={client.apiKey || ""} />
                    }
                </TabsContent>
                <TabsContent value="whatsapp">
                    <div className="w-fit mx-auto mb-4">
                        <ProviderSelector client={client}/>
                    </div>
                    <WhatsappTab client={client} basePath={BASE_PATH} />
                </TabsContent>
                <TabsContent value="general">
                    <ConfigsPage />
                </TabsContent>
            </Tabs>    

        </div>
    )
}
