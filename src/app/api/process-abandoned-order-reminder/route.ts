import { processCampaignContact, setCampaignContactStatus } from "@/services/campaign-services"
import { NextResponse } from "next/server"
import { Receiver } from "@upstash/qstash"
import { CampaignContactStatus, ReminderStatus } from "@/lib/generated/prisma";
import { processReminder, setReminderStatus } from "@/services/reminder-services";

export const maxDuration = 299

const baseUrl= process.env.NEXTAUTH_URL === "http://localhost:3000" ? "https://local.rctracker.dev" : process.env.NEXTAUTH_URL

export async function POST(request: Request, { params }: { params: { clientId: string } }) {
    let reminderId = null

    try {
        const receiver = new Receiver({
            currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
            nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!
        })

        const rawBody = await request.text()
        const signature = request.headers.get("Upstash-Signature") || ""

        const isValid = await receiver.verify({
            body: rawBody,
            signature,
            url: `${baseUrl}/api/process-abandoned-order-reminder`,
        })

        if (!isValid) {
            console.error("Firma de verificación fallida para recordatorio de orden abandonada")
            return NextResponse.json({ error: "Firma inválida" }, { status: 400 })
        }

        const body = JSON.parse(rawBody)
        reminderId = body.reminderId;
        if (!reminderId) {
            return NextResponse.json({ 
                success: false,
                error: "Se requiere el ID del recordatorio" 
            }, { status: 200 })
        }
        
        console.log(`⏱️ Procesando recordatorio de orden abandonada: ${reminderId}`)
    
        const processed = await processReminder(reminderId)
        if (!processed) {
            console.error(`❌ Error al procesar el recordatorio de orden abandonada: ${reminderId}`)
            return NextResponse.json({ 
                success: false,
                error: "Error al procesar el recordatorio de orden abandonada" 
            }, { status: 200 })
        }

        // Verificar si el recordatorio está en estado ERROR después de procesarlo
        if (processed.status === ReminderStatus.ERROR) {
            const errorMessage = processed.error || "Error desconocido durante el procesamiento";
            console.error(`❌ El recordatorio se procesó pero terminó en estado ERROR: ${errorMessage}`);
            
            return NextResponse.json({ 
                success: false,
                error: "Error al procesar el recordatorio de orden abandonada", 
                message: errorMessage,
                reminderId: reminderId,
                status: processed.status,
                abandonedOrderId: processed.abandonedOrderId
            }, { status: 200 });
        }

        console.log(`✅ Recordatorio de orden abandonada procesado con éxito: ${reminderId}`)
        return NextResponse.json({ 
            success: true,
            message: "Recordatorio de orden abandonada procesado con éxito" 
        }, { status: 200 })
    } catch (error) {
        console.error("❌ Error al procesar el recordatorio de orden abandonada en la API")
        if (error instanceof Error) {
            console.error(`Error detallado: ${error.message}`)
        }
        const errorMessage = error instanceof Error ? error.message : "Error desconocido"
        if (reminderId) {
            console.log(`⚠️ Actualizando estado del recordatorio a ERROR: ${reminderId}`)
            await setReminderStatus(reminderId, ReminderStatus.ERROR, errorMessage)
        }
        return NextResponse.json({ 
            success: false,
            error: "Error al procesar el recordatorio de orden abandonada",
            message: errorMessage,
            reminderId: reminderId 
        }, { status: 200 })
    }
}

export async function GET(request: Request) {
    return NextResponse.json({ 
        status: "active", 
        message: "API de procesamiento de recordatorios de órdenes abandonadas funcionando" 
    }, { status: 200 })
}

