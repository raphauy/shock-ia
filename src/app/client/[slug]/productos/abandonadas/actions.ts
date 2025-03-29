"use server"

import { revalidatePath } from "next/cache"
import { getTodayAbandonedOrders } from "@/services/fenicio-services"
import { createAbandonedOrder, externalIdExists, setAbandonedOrdersTemplate } from "@/services/abandoned-orders-service"

/**
 * Server action para buscar órdenes abandonadas de las últimas 24 horas y guardarlas en la base de datos
 */
export async function checkAbandonedOrdersAction(clientId: string) {
    try {
        // Obtener las órdenes abandonadas de las últimas 24 horas
        const ordenesResponse = await getTodayAbandonedOrders(clientId);
        
        if (ordenesResponse.error) {
            console.error("❌ Error al obtener órdenes abandonadas:", ordenesResponse.msj);
            return { 
                error: true, 
                mensaje: ordenesResponse.msj
            };
        }
        
        if (!ordenesResponse.ordenes || ordenesResponse.ordenes.length === 0) {
            console.log("ℹ️ No se encontraron órdenes abandonadas en las últimas 24 horas");
            return { 
                error: false, 
                mensaje: "No se encontraron órdenes abandonadas en las últimas 24 horas",
                totalOrdenes: 0,
                ordenesProcesadas: 0
            };
        }
        
        console.log(`✅ Se encontraron ${ordenesResponse.ordenes.length} órdenes abandonadas`);
        
        // Guardar las órdenes abandonadas en la base de datos
        let ordenesProcesadas = 0;
        let ordenesExistentes = 0;
        let errores = 0;
        
        for (const orden of ordenesResponse.ordenes) {
            try {
                // Verificar si la orden ya existe en la base de datos
                if (await externalIdExists(clientId, orden.idOrden)) {
                    console.log(`⚠️ La orden ${orden.idOrden} ya existe en la base de datos`);
                    ordenesExistentes++;
                    continue;
                }
                
                // Guardar la orden abandonada
                await createAbandonedOrder(clientId, orden);
                console.log(`✅ Orden abandonada ${orden.idOrden} guardada correctamente`);
                ordenesProcesadas++;
            } catch (error: any) {
                console.error(`❌ Error al guardar la orden abandonada ${orden.idOrden}:`, error.message);
                errores++;
            }
        }
        
        // Revalidar la ruta para actualizar los datos mostrados
        revalidatePath(`/client/${clientId}/productos/abandonadas`);
        
        return {
            error: false,
            mensaje: "Proceso completado",
            totalOrdenes: ordenesResponse.ordenes.length,
            ordenesProcesadas,
            ordenesExistentes,
            errores
        };
        
    } catch (error: any) {
        console.error("❌ Error durante el procesamiento de órdenes abandonadas:", error.message);
        return { 
            error: true, 
            mensaje: `Error al procesar órdenes abandonadas: ${error.message}`
        };
    }
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