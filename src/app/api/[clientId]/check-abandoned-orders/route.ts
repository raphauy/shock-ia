import { getClient } from "@/services/clientService"
import { getTodayAbandonedOrders } from "@/services/fenicio-services"
import { createAbandonedOrder, externalIdExists } from "@/services/abandoned-orders-service"
import { NextResponse } from "next/server"

type Props = {
    params: {
        clientId: string
    }
}

export async function POST(request: Request, { params }: Props) {
    const clientId = params.clientId
    const client = await getClient(clientId)
    if (!client) {
        return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    try {
        console.log("🔍 Buscando órdenes abandonadas para el cliente:", client.name)
        
        // Obtener las órdenes abandonadas del día actual
        const ordenesResponse = await getTodayAbandonedOrders(clientId)
        
        if (ordenesResponse.error) {
            console.error("❌ Error al obtener órdenes abandonadas:", ordenesResponse.msj)
            return NextResponse.json({ 
                error: true, 
                mensaje: ordenesResponse.msj
            }, { status: 500 })
        }
        
        if (!ordenesResponse.ordenes || ordenesResponse.ordenes.length === 0) {
            console.log("ℹ️ No se encontraron órdenes abandonadas para el día de hoy")
            return NextResponse.json({ 
                error: false, 
                mensaje: "No se encontraron órdenes abandonadas para el día de hoy",
                totalOrdenes: 0,
                ordenesProcesadas: 0
            })
        }
        
        console.log(`✅ Se encontraron ${ordenesResponse.ordenes.length} órdenes abandonadas`)
        
        // Guardar las órdenes abandonadas en la base de datos
        let ordenesProcesadas = 0
        let ordenesExistentes = 0
        let errores = 0
        
        for (const orden of ordenesResponse.ordenes) {
            try {
                // Verificar si la orden ya existe en la base de datos
                if (await externalIdExists(clientId, orden.idOrden)) {
                    console.log(`⚠️ La orden ${orden.idOrden} ya existe en la base de datos`)
                    ordenesExistentes++
                    continue
                }
                
                // Guardar la orden abandonada
                await createAbandonedOrder(clientId, orden)
                console.log(`✅ Orden abandonada ${orden.idOrden} guardada correctamente`)
                ordenesProcesadas++
            } catch (error: any) {
                console.error(`❌ Error al guardar la orden abandonada ${orden.idOrden}:`, error.message)
                errores++
            }
        }
        
        return NextResponse.json({
            error: false,
            mensaje: "Proceso completado",
            totalOrdenes: ordenesResponse.ordenes.length,
            ordenesProcesadas,
            ordenesExistentes,
            errores
        })
        
    } catch (error: any) {
        console.error("❌ Error durante el procesamiento de órdenes abandonadas:", error.message)
        return NextResponse.json({ 
            error: true, 
            mensaje: `Error al procesar órdenes abandonadas: ${error.message}`
        }, { status: 500 })
    }
}