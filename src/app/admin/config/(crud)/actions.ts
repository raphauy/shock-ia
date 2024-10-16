"use server"

import { setHaveAgents, setHaveEvents, setTokensPrice } from "@/services/clientService"
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