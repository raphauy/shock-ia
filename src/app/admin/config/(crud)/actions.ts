"use server"

import { setHaveAgents, setHaveAudioResponse, setHaveCRM, setHaveEvents, setHaveProducts, setTokensPrice, setWapSendFrequency } from "@/services/clientService"
import { createOrUpdateEcommerceFeed, getProductsGoogleFormat } from "@/services/product-services"
import { addTagToFunction, removeTagFromFunction } from "@/services/function-services"
import { revalidatePath } from "next/cache"
import { EcommerceProvider } from "@prisma/client"


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

export async function setWapSendFrequencyAction(clientId: string, notUsed: string, wapSendFrequency: number): Promise<boolean> {
    const client= await setWapSendFrequency(clientId, wapSendFrequency)

    if (!client) {
        return false
    }

    revalidatePath(`/admin/config`)

    return true    
}

export async function setHaveAudioResponseAction(clientId: string, haveAudioResponse: boolean) {
    const client= await setHaveAudioResponse(clientId, haveAudioResponse)

    revalidatePath(`/admin/config`)

    return client    
}

export async function setHaveProductsAction(clientId: string, haveProducts: boolean) {
    const client = await setHaveProducts(clientId, haveProducts)

    revalidatePath(`/admin/config`)

    return client
}

/**
 * Valida si una URL contiene un feed de productos válido en formato Google Shopping
 * @param url URL del feed a validar
 * @returns Objeto con información de validación y cantidad de productos
 */
export async function validateProductFeedAction(url: string): Promise<{ isValid: boolean, productCount: number }> {
  try {
    // Validamos con un límite de 1 producto para ser eficientes
    // pero obtenemos el conteo total de productos
    const result = await getProductsGoogleFormat(url, 1)
    
    // Devolvemos si es válido y la cantidad de productos
    return {
      isValid: result.products.length > 0,
      productCount: result.totalCount
    }
  } catch (error) {
    console.error('Error al validar el feed de productos:', error)
    return {
      isValid: false,
      productCount: 0
    }
  }
}

/**
 * Crea o actualiza un feed de productos para un cliente
 * @param clientId ID del cliente
 * @param url URL del feed de productos
 * @returns true si se creó/actualizó correctamente
 */
export async function createProductFeedAction(clientId: string, url: string): Promise<boolean> {
  try {
    // Primero validamos que el feed sea válido
    const validation = await validateProductFeedAction(url)
    
    if (!validation.isValid) {
      return false
    }
    
    // Si es válido, creamos o actualizamos el feed, incluyendo el conteo de productos
    await createOrUpdateEcommerceFeed(
      clientId,
      "Feed de productos",
      url,
      "FENICIO", // Por defecto asumimos Fenicio
      "google",
      validation.productCount > 0 ? validation.productCount : 0
    )
    
    revalidatePath('/admin/config')
    return true
  } catch (error) {
    console.error('Error al crear el feed de productos:', error)
    return false
  }
}

export async function getProductFeedAction(clientId: string) {
    try {
        // Importamos la función necesaria desde Prisma
        const { PrismaClient } = require('@prisma/client')
        const prisma = new PrismaClient()
        
        // Buscamos el feed activo para este cliente
        const feed = await prisma.ecommerceFeed.findFirst({
            where: { 
                clientId,
                active: true
            }
        })
        
        // Cerramos la conexión
        await prisma.$disconnect()
        
        // Retornamos la URL si existe el feed, o null si no
        return feed ? feed.url : null
    } catch (error) {
        console.error("Error al obtener el feed de productos:", error)
        return null
    }
}