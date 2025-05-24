import { NextResponse } from "next/server";
import { getIncomingMessageStatus, processIncomingMessage, saveChatwootMessage } from "@/services/conversation-v2-services";
import { IncomingChatwootMessage } from "@/services/chatwoot-types";
import { getClientIdByChatwootAccountId } from "@/services/clientService";

export const maxDuration = 299

export async function POST(request: Request) {

    try {
        const json = await request.json()
        
        // Log completo de toda la estructura recibida para análisis
        console.log("===== CHATWOOT-V2 MESSAGE RECEIVED =====")
        //console.log("Mensaje completo:", JSON.stringify(json, null, 2))
        
        // Log de campos específicos que nos interesan
        if (json.account) console.log("accountId:", json.account.id)
        if (json.conversation) console.log("conversationId:", json.conversation.id)
        if (json.content_type) console.log("contentType:", json.content_type)
        if (json.content) console.log("content:", json.content)
        if (json.message_type) console.log("messageType:", json.message_type)
        if (json.inbox) console.log("inboxName:", json.inbox.name)
        if (json.sender) {
            console.log("senderId:", json.sender.id)
            console.log("senderName:", json.sender.name)
            console.log("senderPhone:", json.sender.phone_number)
        }
        
        // Log específico para adjuntos
        if (json.attachments && json.attachments.length > 0) {
            console.log("===== ATTACHMENTS DETECTED =====")
            console.log("Cantidad de adjuntos:", json.attachments.length)
            json.attachments.forEach((attachment: any, index: number) => {
                console.log(`Adjunto ${index + 1}:`)
                console.log("  Tipo:", attachment.file_type)
                console.log("  URL:", attachment.data_url)
                console.log("  Metadata:", JSON.stringify(attachment, null, 2))
            })
        }
        
        // Validaciones básicas
        if (!json.account || !json.conversation) {
            console.log("Error: account or conversation is missing")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }
        
        // Validación del tipo de mensaje (solo procesamos mensajes entrantes)
        if (json.message_type !== "incoming") {
            console.log("Mensaje no procesado: message_type no es 'incoming'")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }
        
        // Validación del estado de la conversación (solo procesamos conversaciones pendientes)
        if (json.conversation.status !== "pending") {
            console.log("Mensaje no procesado: conversation.status no es 'pending'")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }
        
        // En desarrollo, solo procesar ciertos números para cuentas específicas
        const accountId = json.account.id;
        const clientId= await getClientIdByChatwootAccountId(String(accountId))
        if (!clientId) {
            console.log("Error: clientId not found")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }
        const senderPhone = json.sender.phone_number;
        if ((accountId === 16 || accountId === 1) && 
            senderPhone !== null &&
            (senderPhone !== "+59892265737" && senderPhone !== "+59892045358")) {
            console.log("Mensaje no procesado: número no permitido para esta cuenta en desarrollo")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }
        
        // Validar mensajes de conexión API que no deben procesarse
        const senderName = json.sender.name;
        if (senderName === "EvolutionAPI" || senderPhone === "+123456") {
            console.log("Mensaje de conexión API, no procesado")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }
        
        // Pasamos el mensaje a nuestro servicio para su procesamiento
        console.log("===== PROCESANDO MENSAJE DE CHATWOOT V2 =====")
        const startTime = Date.now();
        const result = await saveChatwootMessage(json as IncomingChatwootMessage)
        if (result.success) {
            const savedMessageId= result.messageId!
            const processOk= await processIncomingMessage(savedMessageId, clientId)
            if (!processOk) {
                console.error("Error al procesar el mensaje:", processOk)
                return NextResponse.json({ data: "ACK", processed: false, error: processOk }, { status: 200 })
            }
        } else {
            console.log("Error al guardar el mensaje:", result.error)
            return NextResponse.json({ data: "ACK", processed: false, error: result.error }, { status: 200 })
        }
        
        const duration = Date.now() - startTime;       
        console.log(`===== MENSAJE PROCESADO EXITOSAMENTE (${duration}ms) =====`)
        return NextResponse.json({ data: "ACK", processed: true }, { status: 200 })
    
    } catch (error) {
        console.log("Error al procesar mensaje de Chatwoot:", error)
        return NextResponse.json({ error: "Error al procesar mensaje: " + error}, { status: 502 })                
    }

}

export async function GET(request: Request) {
    // Endpoint de verificación simple
    return NextResponse.json({ status: "Chatwoot-v2 API is running" }, { status: 200 })
}


