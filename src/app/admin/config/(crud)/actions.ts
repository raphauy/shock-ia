"use server"

import { setTokensPrice } from "@/services/clientService"


export async function setTokensPriceAction(clientId: string, promptTokensPrice: number, completionTokensPrice: number) {
    const client= await setTokensPrice(clientId, promptTokensPrice,completionTokensPrice)

    return client    
}