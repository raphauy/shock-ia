"use server"

import { setHaveAgents, setHaveAudioResponse, setHaveCRM, setHaveEvents, setHaveOrderFunction, setHaveProducts, setTokensPrice, setWapSendFrequency, clientHasOrderFunction } from "@/services/clientService"
import { createOrUpdateEcommerceFeed, getProductsGoogleFormat } from "@/services/product-services"
import { getProductsGoogleSheetFormat } from "@/services/google-sheets-service"
import { addTagToFunction, removeTagFromFunction } from "@/services/function-services"
import { revalidatePath } from "next/cache"
import { EcommerceProvider } from "@/lib/generated/prisma"

// Función para determinar qué tipo de proveedor es según la URL
function detectProviderType(url: string): {
  provider: EcommerceProvider,
  format: string
} {
  // Verificamos si es una URL de Google Sheets
  if (url.includes('docs.google.com/spreadsheets')) {
    return {
      provider: 'GOOGLE_SHEETS',
      format: 'custom'
    };
  }
  
  // Por defecto asumimos que es Fenicio
  return {
    provider: 'FENICIO',
    format: 'google'
  };
}

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

export async function setHaveOrderFunctionAction(clientId: string, haveOrderFunction: boolean) {
    const result = await setHaveOrderFunction(clientId, haveOrderFunction)

    revalidatePath(`/admin/config`)

    return result
}

/**
 * Verifica si un cliente tiene la función buscarOrden asociada
 * @param clientId ID del cliente a verificar
 * @returns true si el cliente tiene la función buscarOrden asociada
 */
export async function checkClientHasOrderFunctionAction(clientId: string): Promise<boolean> {
    return await clientHasOrderFunction(clientId)
}

/**
 * Valida si una URL contiene un feed de productos válido
 * @param url URL del feed a validar
 * @returns Objeto con información de validación y cantidad de productos
 */
export async function validateProductFeedAction(url: string): Promise<{ 
  isValid: boolean, 
  productCount: number,
  validationDetails?: {
    missingRequired?: string[];
    missingOptional?: string[];
    unknown?: string[];
    errorMessage?: string;
    errorCode?: number;
  }
}> {
  try {
    // Detectar el tipo de proveedor basado en la URL
    const { provider } = detectProviderType(url);
    
    // Si es Google Sheets, usamos la validación específica
    if (provider === 'GOOGLE_SHEETS') {
      const result = await getProductsGoogleSheetFormat(url, 1);
      
      return {
        isValid: result.validation.isValid,
        productCount: result.totalCount,
        validationDetails: {
          missingRequired: result.validation.missingRequired,
          missingOptional: result.validation.missingOptional,
          unknown: result.validation.unknown,
          errorMessage: result.validation.errorMessage,
          errorCode: result.validation.errorCode
        }
      };
    } 
    // Si es Fenicio u otro proveedor que use el formato Google Shopping
    else {
      try {
        // Validamos con un límite de 1 producto para ser eficientes
        // pero obtenemos el conteo total de productos
        const result = await getProductsGoogleFormat(url, 1);
        
        // Devolvemos si es válido y la cantidad de productos
        return {
          isValid: result.products.length > 0,
          productCount: result.totalCount
        };
      } catch (xmlError) {
        console.error('Error específico al validar feed XML:', xmlError);
        let errorMessage = "Error al procesar el feed XML";
        if (xmlError instanceof Error) {
          errorMessage = xmlError.message;
        }
        
        return {
          isValid: false,
          productCount: 0,
          validationDetails: {
            missingRequired: [],
            errorMessage: errorMessage
          }
        };
      }
    }
  } catch (error) {
    console.error('Error al validar el feed de productos:', error);
    let errorMessage = "Error desconocido al validar el feed";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      isValid: false,
      productCount: 0,
      validationDetails: {
        missingRequired: [],
        errorMessage: errorMessage
      }
    };
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
    const validation = await validateProductFeedAction(url);
    
    if (!validation.isValid) {
      return false;
    }
    
    // Detectamos el tipo de proveedor y formato
    const { provider, format } = detectProviderType(url);
    
    // Si es válido, creamos o actualizamos el feed, incluyendo el conteo de productos
    await createOrUpdateEcommerceFeed(
      clientId,
      provider === 'GOOGLE_SHEETS' ? "Feed de productos (Google Sheets)" : "Feed de productos",
      url,
      provider,
      format,
      validation.productCount > 0 ? validation.productCount : 0
    );
    
    revalidatePath('/admin/config');
    return true;
  } catch (error) {
    console.error('Error al crear el feed de productos:', error);
    return false;
  }
}

export async function getProductFeedAction(clientId: string) {
    try {
        // Importamos la función necesaria desde Prisma
        const { PrismaClient } = require('@/lib/generated/prisma')
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