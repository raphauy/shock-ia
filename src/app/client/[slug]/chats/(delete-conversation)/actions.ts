"use server"
  
import { getClient } from "@/services/clientService"
import { closeConversation, deleteConversation } from "@/services/conversationService"
import { revalidatePath } from "next/cache"


export async function deleteConversationAction(id: string): Promise<boolean> {
    const deleted= await deleteConversation(id)

    if (!deleted) return false

    const client= await getClient(deleted.clientId)

    console.log(`revalidating /client/${client?.slug}/chats`);
    

    revalidatePath(`/client/${client?.slug}/chats`)

    return true
}

export async function closeConversationAction(conversationId: string) {
    if (!conversationId) throw new Error("No se puede cerrar una conversación sin mensajes")
    const updated= await closeConversation(conversationId)

    const clientSlug= updated.client.slug
    revalidatePath(`/client/${clientSlug}/simulator`)

    return updated
}