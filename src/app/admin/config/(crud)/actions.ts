"use server"

import { setHaveAgents, setHaveCRM, setHaveEvents, setTokensPrice } from "@/services/clientService"
import { addTagToFunction, removeTagFromFunction } from "@/services/function-services"
import { revalidatePath } from "next/cache"


export async function setTokensPriceAction(clientId: string, promptTokensPrice: number, completionTokensPrice: number) {
    const client= await setTokensPrice(clientId, promptTokensPrice,completionTokensPrice)
    
    revalidatePath(`/admin/config`)

    return client    
}

export async function setHaveEventsAction(clientId: string, haveEvents: boolean) {
    const client= await setHaveEvents(clientId, haveEvents)

    revalidatePath(`/admin/config`)

    return client    
}

export async function setHaveAgentsAction(clientId: string, haveAgents: boolean) {
    const client= await setHaveAgents(clientId, haveAgents)

    revalidatePath(`/admin/config`)

    return client    
}

export async function setHaveCRMAction(clientId: string, haveCRM: boolean) {
    const client= await setHaveCRM(clientId, haveCRM)

    revalidatePath(`/admin/config`)

    return client    
}

export async function addTagToFunctionAction(clientId: string, functionId: string, tag: string) {
    const updated= await addTagToFunction(clientId, functionId, tag)

    revalidatePath(`/admin/config`)

    return updated
}

export async function removeTagFromFunctionAction(clientId: string, functionId: string, tag: string) {
    const updated= await removeTagFromFunction(clientId, functionId, tag)

    revalidatePath(`/admin/config`)

    return updated
}