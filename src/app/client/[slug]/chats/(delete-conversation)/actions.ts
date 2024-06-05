"use server"
  
import { getClient } from "@/services/clientService"
import { deleteConversation } from "@/services/conversationService"
import { revalidatePath } from "next/cache"


export async function deleteConversationAction(id: string): Promise<boolean> {
    const deleted= await deleteConversation(id)

    if (!deleted) return false

    const client= await getClient(deleted.clientId)

    console.log(`revalidating /client/${client?.slug}/chats`);
    

    revalidatePath(`/client/${client?.slug}/chats`)

    return true
}
