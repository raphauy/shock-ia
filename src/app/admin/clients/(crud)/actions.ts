"use server"

import getClients, { clientHaveCRM, clientHaveEvents, createClient, deleteClient, editClient, getClient, getClientBySlug, getComplementaryFunctionsOfClient, getFunctionsOfClient, getLastClient, setFunctions, setPrompt, setWhatsAppEndpoing, setWhatsAppNumbers } from "@/services/clientService";
import { getUser } from "@/services/userService";
import { Client, InboxProvider } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { EndpointFormValues } from "../../config/(crud)/endpoint-form";
import { PromptFormValues } from "../../prompts/prompt-form";
import { ClientFormValues } from "./clientForm";
import { getFullModelDAO } from "@/services/model-services";
import { WhatsappNumbersFormValues } from "../../config/whatsapp-numbers-form";
import { WhatsappInstanceDAO } from "@/services/wrc-sdk-types";

export type DataClient = {
    id: string
    nombre: string
    slug: string
    descripcion: string
    whatsappNumbers: string
    url: string
    modelId: string | null
    cantPropiedades: number
    rentPercentage?: string
    salePercentage?: string
    whatsAppEndpoint: string | null
    prompt?: string | null
    promptTokensPrice?: number | null
    completionTokensPrice?: number | null
    promptCostTokenPrice: number
    completionCostTokenPrice: number
    modelName: string
    haveEvents: boolean
    haveAgents: boolean
    haveCRM: boolean
    haveAudioResponse: boolean
    wapSendFrequency: number
    apiKey: string
    whatsappInstance?: WhatsappInstanceDAO
    inboxProvider: InboxProvider
    availability: string[]
    timezone: string
  }
    

export async function getDataClient(clientId: string): Promise<DataClient | null>{
    const client= await getClient(clientId)
    if (!client) return null

    const model= await getFullModelDAO(client.modelId!)
    const promptCostTokenPrice= model?.inputPrice || 0
    const completionCostTokenPrice= model?.outputPrice || 0

    const propertiesCount= 0

    const data: DataClient= {
        id: client.id,
        nombre: client.name,
        slug: client.slug,
        descripcion: client.description || '',
        whatsappNumbers: client.whatsappNumbers || '',
        url: client.url || '',
        modelId: client.modelId,
        cantPropiedades: propertiesCount,
        whatsAppEndpoint: client.whatsappEndpoint,
        prompt: client.prompt,
        promptTokensPrice: client.promptTokensPrice,
        completionTokensPrice: client.completionTokensPrice,
        promptCostTokenPrice: promptCostTokenPrice,
        completionCostTokenPrice: completionCostTokenPrice,
        modelName: model?.name || '',
        haveEvents: client.haveEvents,
        haveAgents: client.haveAgents,
        haveCRM: client.haveCRM,
        haveAudioResponse: client.haveAudioResponse,
        wapSendFrequency: client.wapSendFrequency,
        apiKey: client.apiKey,
        inboxProvider: client.inboxProvider,
        availability: client.availability,
        timezone: client.timezone
    }
    return data
}

export async function getDataClientOfUser(userId: string): Promise<DataClient | null>{
    
    const user= await getUser(userId)
    if (!user) return null

    const client= user.client
    if (!client) return null

    const model= await getFullModelDAO(client.modelId!)
    const promptCostTokenPrice= model?.inputPrice || 0
    const completionCostTokenPrice= model?.outputPrice || 0

    const propertiesCount= 0

    const data: DataClient= {
        id: client.id,
        nombre: client.name,
        slug: client.slug,
        descripcion: client.description || '',
        whatsappNumbers: client.whatsappNumbers || '',
        url: client.url || '',
        modelId: client.modelId,
        cantPropiedades: propertiesCount,
        whatsAppEndpoint: client.whatsappEndpoint,
        prompt: client.prompt,
        promptTokensPrice: client.promptTokensPrice,
        completionTokensPrice: client.completionTokensPrice,
        promptCostTokenPrice,
        completionCostTokenPrice,
        modelName: model?.name || '',
        haveEvents: client.haveEvents,
        haveAgents: client.haveAgents,
        haveCRM: client.haveCRM,
        haveAudioResponse: client.haveAudioResponse,
        wapSendFrequency: client.wapSendFrequency,
        apiKey: client.apiKey,
        inboxProvider: client.inboxProvider,
        availability: client.availability,
        timezone: client.timezone
    }
    return data
}

export async function getDataClientBySlug(slug: string): Promise<DataClient | null>{
    console.log("getDataClientBySlug: ", slug)
    
    const client= await getClientBySlug(slug)
    if (!client) return null

    const model= client.model
    const promptCostTokenPrice= model?.inputPrice || 0
    const completionCostTokenPrice= model?.outputPrice || 0

    const propertiesCount= 0

    const data: DataClient= {
        id: client.id,
        nombre: client.name,
        slug: client.slug,
        descripcion: client.description || '',
        whatsappNumbers: client.whatsappNumbers || '',
        url: client.url || '',
        modelId: client.modelId,
        cantPropiedades: propertiesCount,
        whatsAppEndpoint: client.whatsappEndpoint,
        prompt: client.prompt,
        promptTokensPrice: client.promptTokensPrice,
        completionTokensPrice: client.completionTokensPrice,
        promptCostTokenPrice,
        completionCostTokenPrice,
        modelName: model?.name || '',
        haveEvents: client.haveEvents,
        haveAgents: client.haveAgents,
        haveCRM: client.haveCRM,
        haveAudioResponse: client.haveAudioResponse,
        wapSendFrequency: client.wapSendFrequency,
        apiKey: client.apiKey,
        inboxProvider: client.inboxProvider,
        availability: client.availability,
        timezone: client.timezone
    }
    return data
}

export async function getLastClientAction(): Promise<DataClient | null>{
    const client= await getLastClient()
    if (!client) return null

    const model= client.model
    const promptCostTokenPrice= model?.inputPrice || 0
    const completionCostTokenPrice= model?.outputPrice || 0

    const propertiesCount= 0

    const data: DataClient= {
        id: client.id,
        nombre: client.name,
        slug: client.slug,
        descripcion: client.description || '',
        whatsappNumbers: client.whatsappNumbers || '',
        url: client.url || '',
        modelId: client.modelId,
        cantPropiedades: propertiesCount,
        whatsAppEndpoint: client.whatsappEndpoint,
        prompt: client.prompt,
        promptTokensPrice: client.promptTokensPrice,
        completionTokensPrice: client.completionTokensPrice,
        promptCostTokenPrice,
        completionCostTokenPrice,
        modelName: model?.name || '',
        haveEvents: client.haveEvents,
        haveAgents: client.haveAgents,
        haveCRM: client.haveCRM,
        haveAudioResponse: client.haveAudioResponse,
        wapSendFrequency: client.wapSendFrequency,
        apiKey: client.apiKey,
        inboxProvider: client.inboxProvider,
        availability: client.availability,
        timezone: client.timezone
    }
    return data
}

export type Percentages = {
    sales: string
    rents: string
}

export async function getDataClients() {
    const clients= await getClients()

    const data: DataClient[] = await Promise.all(
        clients.map(async (client) => {
            const propertiesCount = 0
            const model= client.model
            const promptCostTokenPrice= model?.inputPrice || 0
            const completionCostTokenPrice= model?.outputPrice || 0
        
            return {
                id: client.id,
                nombre: client.name,
                slug: client.slug,
                descripcion: client.description || "",
                whatsappNumbers: client.whatsappNumbers || "",
                url: client.url || "",
                modelId: client.modelId,
                cantPropiedades: propertiesCount,
                rentPercentage: "0",
                salePercentage: "0",
                whatsAppEndpoint: client.whatsappEndpoint,
                prompt: client.prompt,
                promptTokensPrice: client.promptTokensPrice,
                completionTokensPrice: client.completionTokensPrice,
                promptCostTokenPrice,
                completionCostTokenPrice,
                modelName: model?.name || '',
                haveEvents: client.haveEvents,
                haveAgents: client.haveAgents,
                haveCRM: client.haveCRM,
                haveAudioResponse: client.haveAudioResponse,
                wapSendFrequency: client.wapSendFrequency,
                apiKey: client.apiKey,
                whatsappInstance: client.whatsappInstances.length === 0 ? undefined : client.whatsappInstances[0],
                inboxProvider: client.inboxProvider,
                availability: client.availability,
                timezone: client.timezone
            };
        })
    );

    revalidatePath(`/admin/config`)
    
    return data    
}

export async function create(data: ClientFormValues): Promise<Client | null> {       
    const created= await createClient(data)

    console.log(created);

    revalidatePath(`/admin`)
    revalidatePath(`/client/[slug]`, "layout")

    return created
}
  
export async function update(clientId: string, data: ClientFormValues): Promise<Client | null> {  
    const edited= await editClient(clientId, data)    

    revalidatePath(`/admin`)
    
    return edited
}


export async function eliminate(clientId: string): Promise<Client | null> {    
    const deleted= await deleteClient(clientId)

    revalidatePath(`/admin`)

    return deleted
}

export async function updateEndpoint(json: EndpointFormValues) {

    if (!json.whatsappEndpoint || !json.clienteId)
        return

    setWhatsAppEndpoing(json.whatsappEndpoint, json.clienteId)

    revalidatePath(`/admin/config`)
}

export async function updatePrompt(json: PromptFormValues) {

    if (!json.prompt || !json.clienteId)
        return

    setPrompt(json.prompt, json.clienteId)

    revalidatePath(`/admin/config`)
}

export async function updateWhatsAppNumbersAction(json: WhatsappNumbersFormValues) {
    if (!json.whatsappNumbers || !json.clienteId)
        return

    await setWhatsAppNumbers(json.whatsappNumbers, json.clienteId)

    revalidatePath(`/admin/config`)
}
export async function getFunctionsOfClientAction(clientId: string) {
    return getFunctionsOfClient(clientId)
}

export async function getComplementaryFunctionsOfClientAction(clientId: string) {
    return getComplementaryFunctionsOfClient(clientId)
}

export async function setFunctionsAction(clientId: string, functionIs: string[]) {
    return setFunctions(clientId, functionIs)
}

export async function getLastClientIdAction() {
    const client= await getLastClient()
    return client?.id
}

export async function clientHaveEventsAction(slug: string): Promise<boolean> {
    const haveEvents= await clientHaveEvents(slug)
    return haveEvents
}

export async function clientHaveCRMAction(slug: string): Promise<boolean> {
    const haveCRM= await clientHaveCRM(slug)
    return haveCRM
}