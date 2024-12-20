"use server"

import { getFormat } from "@/lib/utils"
import { deleteConversation, getConversation, getConversationsShortOfClient, getLastConversation } from "@/services/conversationService"
import { Client, Conversation, Message } from "@prisma/client"
import { revalidatePath } from "next/cache"


export type DataMessage = {
    id: string
    fecha: string
    updatedAt: Date
    role: string
    content: string
    gptData: string | null
    promptTokens: number
    completionTokens: number
}

export type DataConversation = {
    id: string
    fecha: string
    updatedAt: string
    celular: string
    messages: DataMessage[]
    clienteNombre: string
    clienteSlug: string
    clienteId?: string
    operacion?: string
    tipo?: string
    zona?: string
    presupuesto?: string
}
 
export type DataConversationShort = {
    id: string
    createdAt: Date
    updatedAt: Date
    phone: string
    client: {
        name: string
        slug: string
    }
}

export async function getDataConversationAction(conversationId: string): Promise<DataConversation | null>{
    const conversation= await getConversation(conversationId)
    if (!conversation) return null

    const data= getData(conversation)
    
    return data
}

export async function getLastDataConversationAction(slug: string): Promise<DataConversation | null>{
    console.log("slug: ", slug)
    const conversation= await getLastConversation(slug)
    if (!conversation) return null

    const data= getData(conversation)
    
    return data
}

function getData(conversation: Conversation & { messages: Message[], client: Client }): DataConversation {
    const data: DataConversation= {
        id: conversation.id,
        fecha: getFormat(conversation.createdAt),
        updatedAt: getFormat(conversation.updatedAt),
        celular: conversation.phone,
        messages: conversation.messages.map((message: Message) => ({
            id: message.id,
            fecha: getFormat(message.createdAt),
            updatedAt: message.updatedAt,
            role: message.role,
            content: message.content,
            gptData: message.gptData,
            promptTokens: message.promptTokens,
            completionTokens: message.completionTokens,
        })),
        clienteNombre: conversation.client.name,
        clienteSlug: conversation.client.slug,
        clienteId: conversation.clientId,
        operacion: conversation.operacion || undefined,
        tipo: conversation.tipo || undefined,
        zona: conversation.zona || undefined,
        presupuesto: conversation.presupuesto || undefined        
    }
    return data
}


export async function getDataConversationsShort(clientId: string) {
    const conversationsShort= await getConversationsShortOfClient(clientId)

    return conversationsShort as DataConversationShort[]
}

export async function eliminate(conversationId: string): Promise<Conversation | null> {    
    const deleted= await deleteConversation(conversationId)

    revalidatePath(`/admin/conversations`)

    return deleted
}
