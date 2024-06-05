"use server"

import getClients, { createClient, deleteClient, editClient, getClient, getClientBySlug, getComplementaryFunctionsOfClient, getFunctionsOfClient, getLastClient, setFunctions, setPrompt, setWhatsAppEndpoing } from "@/services/clientService";
import { getUser } from "@/services/userService";
import { Client } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { EndpointFormValues } from "../../config/(crud)/endpoint-form";
import { PromptFormValues } from "../../prompts/prompt-form";
import { ClientFormValues } from "./clientForm";
import { getFullModelDAO } from "@/services/model-services";

export type DataClient = {
    id: string
    nombre: string
    slug: string
    descripcion: string
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
        url: client.url || '',
        modelId: client.modelId,
        cantPropiedades: propertiesCount,
        whatsAppEndpoint: client.whatsappEndpoint,
        prompt: client.prompt,
        promptTokensPrice: client.promptTokensPrice,
        completionTokensPrice: client.completionTokensPrice,
        promptCostTokenPrice: promptCostTokenPrice,
        completionCostTokenPrice: completionCostTokenPrice,
        modelName: model?.name || ''
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
        url: client.url || '',
        modelId: client.modelId,
        cantPropiedades: propertiesCount,
        whatsAppEndpoint: client.whatsappEndpoint,
        prompt: client.prompt,
        promptTokensPrice: client.promptTokensPrice,
        completionTokensPrice: client.completionTokensPrice,
        promptCostTokenPrice,
        completionCostTokenPrice,
        modelName: model?.name || ''
    }
    return data
}

export async function getDataClientBySlug(slug: string): Promise<DataClient | null>{
    
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
        url: client.url || '',
        modelId: client.modelId,
        cantPropiedades: propertiesCount,
        whatsAppEndpoint: client.whatsappEndpoint,
        prompt: client.prompt,
        promptTokensPrice: client.promptTokensPrice,
        completionTokensPrice: client.completionTokensPrice,
        promptCostTokenPrice,
        completionCostTokenPrice,
        modelName: model?.name || ''
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
        url: client.url || '',
        modelId: client.modelId,
        cantPropiedades: propertiesCount,
        whatsAppEndpoint: client.whatsappEndpoint,
        prompt: client.prompt,
        promptTokensPrice: client.promptTokensPrice,
        completionTokensPrice: client.completionTokensPrice,
        promptCostTokenPrice,
        completionCostTokenPrice,
        modelName: model?.name || ''
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
                modelName: model?.name || ''
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

    revalidatePath(`/admin/prompts`)
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