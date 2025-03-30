"use server"

import { revalidatePath } from "next/cache"
import { setAbandonedOrdersTemplate, setAbandonedOrdersExpireTime } from "@/services/abandoned-orders-service"
import { setValue } from "@/services/config-services"

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
 * Server action para configurar el tiempo de expiración de órdenes abandonadas
 */
export async function setExpireTimeAction(clientId: string, hours: string) {
    try {
        // Validar que el valor sea un número entero positivo
        const hoursNum = parseInt(hours, 10);
        if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 720) {
            return {
                error: true,
                message: "El tiempo de expiración debe ser un número entre 1 y 720 horas"
            };
        }
        
        // Guardar la configuración específica del cliente
        await setAbandonedOrdersExpireTime(clientId, hoursNum);
        
        // Revalidar todas las rutas relacionadas con órdenes abandonadas
        revalidatePath(`/client/${clientId}/productos/config`);
        revalidatePath(`/client/${clientId}/productos/abandonadas`);
        
        return {
            error: false,
            message: "Tiempo de expiración configurado correctamente"
        };
    } catch (error: any) {
        console.error("❌ Error al configurar el tiempo de expiración:", error.message);
        return {
            error: true,
            message: `Error al configurar el tiempo de expiración: ${error.message}`
        };
    }
} 