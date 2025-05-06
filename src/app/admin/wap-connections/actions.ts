"use server"

import { fetchInstance } from "@/services/wrc-sdk"
import { getWebhookStatus, setWebhook } from "@/services/wrc-sdk"
import { WRCInstance } from "@/services/wrc-sdk-types"
import { getValue, setValue } from "@/services/config-services"

/**
 * Obtiene los datos completos de una instancia de WhatsApp por su nombre
 * @param instanceName Nombre de la instancia
 * @returns Datos completos de la instancia o null si no se encuentra
 */
export async function fetchInstanceAction(instanceName: string): Promise<WRCInstance | null> {
  try {
    const instance = await fetchInstance(instanceName)
    console.log("instance", instance)
    return instance
  } catch (error) {
    console.error("Error obteniendo instancia:", error)
    throw error
  }
}

/**
 * Obtiene el estado de webhook para una instancia
 * @param instanceName Nombre de la instancia
 * @returns Estado del webhook (enabled, url, events)
 */
export async function getWebhookStatusAction(instanceName: string) {
  try {
    const status = await getWebhookStatus(instanceName)
    return status
  } catch (error) {
    console.error("Error obteniendo estado del webhook:", error)
    throw error
  }
}

/**
 * Configura el webhook para una instancia
 * @param clientId ID del cliente
 * @param enabled Si el webhook debe estar habilitado o no
 * @returns true si se configuró correctamente, false en caso contrario
 */
export async function setWebhookAction(clientId: string, enabled: boolean) {
  try {
    const status = await setWebhook(clientId, enabled)
    return status
  } catch (error) {
    console.error("Error configurando webhook:", error)
    throw error
  }
}

/**
 * Obtiene los números de teléfono configurados para recibir notificaciones de desconexión
 * @returns String con los números de teléfono separados por comas o cadena vacía si no hay configuración
 */
export async function getNotificationNumbersAction() {
  try {
    const value = await getValue("WHATSAPP_DISCONNECT_NOTIFICATIONS")
    return value || ""
  } catch (error) {
    console.error("Error obteniendo números de notificación:", error)
    return ""
  }
}

/**
 * Establece los números de teléfono para recibir notificaciones de desconexión
 * @param phoneNumbers String con los números de teléfono separados por comas
 * @returns true si se configuró correctamente, false en caso contrario
 */
export async function setNotificationNumbersAction(phoneNumbers: string) {
  try {
    await setValue("WHATSAPP_DISCONNECT_NOTIFICATIONS", phoneNumbers)
    return true
  } catch (error) {
    console.error("Error configurando números de notificación:", error)
    return false
  }
} 