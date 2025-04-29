"use server"

import { revalidatePath } from "next/cache"
import { getTodayAbandonedOrders } from "@/services/fenicio-services"
import { checkAbandonedOrders, createAbandonedOrder, externalIdExists, processAbandonedOrder, setAbandonedOrdersTemplate } from "@/services/abandoned-orders-service"

/**
 * Server action para buscar órdenes abandonadas de las últimas 24 horas y guardarlas en la base de datos
 */
export async function checkAbandonedOrdersAction(clientId: string) {
    const res = await checkAbandonedOrders(clientId);

    // Revalidar la ruta para actualizar los datos mostrados
    revalidatePath(`/client/${clientId}/productos/abandonadas`);

    return res;
}

/**
 * Server action para configurar la plantilla de recordatorios para órdenes abandonadas
 */
export async function setAbandonedOrdersTemplateAction(clientId: string, templateId: string) {
    try {
        await setAbandonedOrdersTemplate(clientId, templateId);
        
        // Revalidar la ruta para actualizar los datos mostrados
        revalidatePath(`/client/${clientId}/productos/config`);
        
        return {
            error: false,
            mensaje: "Plantilla configurada correctamente"
        };
    } catch (error: any) {
        console.error("❌ Error al configurar la plantilla:", error.message);
        return {
            error: true,
            mensaje: `Error al configurar la plantilla: ${error.message}`
        };
    }
}

/**
 * Server action para procesar una orden abandonada (verificar expiración o enviar recordatorio)
 */
export async function processAbandonedOrderAction(orderId: string) {
    try {
        // Procesar la orden abandonada
        const result = await processAbandonedOrder(orderId);
        
        // Revalidar la ruta para actualizar los datos mostrados
        revalidatePath(`/client/${result.clientId}/productos/abandonadas`);
        
        return {
            error: false,
            mensaje: `Orden procesada correctamente. Estado: ${result.status}`,
            order: result
        };
    } catch (error: any) {
        console.error("❌ Error al procesar la orden abandonada:", error.message);
        return { 
            error: true, 
            mensaje: `Error al procesar la orden abandonada: ${error.message}`
        };
    }
}