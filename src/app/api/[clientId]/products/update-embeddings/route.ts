import { getClient } from "@/services/clientService"
import { generateProductEmbeddings } from "@/services/product-services"
import { NextResponse } from "next/server"

type Props = {
    params: {
        clientId: string
    }
}

async function updateEmbeddings(clientId: string, forceUpdate: boolean, batchSize: number) {
    const client = await getClient(clientId)
    if (!client) {
        return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    try {
        console.log("🔄 Iniciando actualización de embeddings para el cliente:", client.name)
        
        // Actualizar embeddings
        const result = await generateProductEmbeddings(clientId, forceUpdate, batchSize)
        
        console.log(`✅ Actualización de embeddings completada para ${client.name}`)
        console.log(`- Productos actualizados: ${result.updatedCount}`)
        console.log(`- Tiempo de ejecución: ${result.executionTime} segundos`)
        
        return NextResponse.json({
            error: false,
            mensaje: "Actualización de embeddings completada",
            totalActualizados: result.updatedCount,
            tiempoEjecucion: result.executionTime
        })
        
    } catch (error: any) {
        console.error("❌ Error durante la actualización de embeddings:", error.message)
        return NextResponse.json({ 
            error: true, 
            mensaje: `Error al actualizar embeddings: ${error.message}`
        }, { status: 500 })
    }
}

export async function GET(request: Request, { params }: Props) {
    return updateEmbeddings(params.clientId, false, 250)
}

export async function POST(request: Request, { params }: Props) {
    const body = await request.json()
    const forceUpdate = body.forceUpdate || false
    const batchSize = body.batchSize || 50
    
    return updateEmbeddings(params.clientId, forceUpdate, batchSize)
}
