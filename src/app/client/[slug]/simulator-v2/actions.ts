'use server';

import { generateText, Message } from 'ai';
import { cookies } from 'next/headers';

import { myProvider } from '@/lib/ai/providers';
import { closeConversation, getActiveConversation } from '@/services/conversationService';
import { revalidatePath } from 'next/cache';
import { getConversationIdFromMessageId } from '@/services/messages-service';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function closeConversationAction(conversationId: string) {
  if (!conversationId) throw new Error("No se puede cerrar una conversación sin mensajes")
  const updated= await closeConversation(conversationId)

  const clientSlug= updated.client.slug
  revalidatePath(`/client/${clientSlug}/simulator-v2`)

  return updated
}

export async function getActiveConversationIdAction(email: string, clientId: string) {
  const conversation= await getActiveConversation(email, clientId)
  if (!conversation) {
    throw new Error("No se pudo obtener el ID de la conversación")
  }
  return conversation.id
}