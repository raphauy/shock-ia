import { getMostRecentUserMessage } from '@/lib/ai/chat-utils';
import { myProvider } from '@/lib/ai/providers';
import { getAllClientTools } from '@/lib/ai/tools';
import { getCurrentUser } from '@/lib/auth';
import { getClient } from '@/services/clientService';
import { getValue } from '@/services/config-services';
import { ContactFormValues, createContact, getContactByPhone } from '@/services/contact-services';
import { getClientContext } from '@/services/conversation-v2-services';
import { createConversation, getActiveConversation, getSystemMessage } from '@/services/conversationService';
import { getContext } from '@/services/function-call-services';
import { MessageFormValues, saveMessage } from '@/services/messages-service';
import { getFullModelDAO, getFullModelDAOByName } from '@/services/model-services';
import { getStageByChatwootId } from '@/services/stage-services';
import { openai } from '@ai-sdk/openai';
import { appendResponseMessages, streamText } from 'ai';
import { NextResponse } from 'next/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const currentUser= await getCurrentUser()
    if (!currentUser) {
      return new Response("User not found", { status: 404 })
    }
    if (!currentUser.email) {
      return new Response("User email not found", { status: 404 })
    }
    const email= currentUser.email
  
    const { messages, clientId, selectedChatModel } = await req.json()

    const MAX_MESSAGES_TO_PROCESS= await getValue("MAX_MESSAGES_TO_PROCESS")
    const maxInWindow= MAX_MESSAGES_TO_PROCESS ? parseInt(MAX_MESSAGES_TO_PROCESS) + 1 : 1000

    const messagesCount= messages.length
    const lastMessages= messages.slice(messagesCount - maxInWindow, messagesCount)
  
  
    // Validar que clientId exista
    if (!clientId) {
      return new Response("Client ID is required", { status: 400 })
    }

    const client= await getClient(clientId)
    if (!client) {
      return new Response("Client not found", { status: 404 })
    }

    if (!client.prompt) {
      return new Response("Client prompt not found", { status: 404 })
    }

    const userMessage = getMostRecentUserMessage(messages);
  
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }
  
    const stage= await getStageByChatwootId(email, clientId)
    if (stage && !stage.isBotEnabled) {
      return new Response("Bot disabled", { status: 404 })
    }
  
    if (!client.modelId) return NextResponse.json({ message: "Este cliente no tiene modelo asignado" }, { status: 502 })
  
    // let model= modelName && await getFullModelDAOByName(modelName)
    // if (!model) {
    //   model= await getFullModelDAO(client.modelId)
    // }
    // const provider= model.provider
    
    // if (!provider.streaming || !model.streaming) return NextResponse.json({ error: "Proveedor o modelo no soporta streaming" }, { status: 502 })

    const conversationId= await getActiveConversationId(email, currentUser.name || email, client.id)
    const messageFormValues: MessageFormValues= {
      conversationId,
      role: "user",
      content: userMessage.content,
      parts: userMessage.parts || [],
      attachments: userMessage.experimental_attachments || [],
    }
    await saveMessage(messageFormValues)

    const system= await getClientContext(clientId, email, client.prompt)   

    console.log("lastMessages.count: " + lastMessages.length)
    //console.log("systemMessage: " + system)

    const tools= await getAllClientTools(client.id)

    console.log("selectedChatModel: " + selectedChatModel)

    const result = streamText({
        
        model: myProvider.languageModel(selectedChatModel),
        temperature: 0,
        maxSteps: 10,
        system,
        messages: lastMessages,
        tools,
        onFinish: async ({usage, response}) => {
            console.log("--------------------------------")
            console.log("[onFinish] usage: " + JSON.stringify(usage))
            //console.log("[onFinish] response: " + JSON.stringify(response, null, 3))
            const promptTokens= usage.promptTokens
            const completionTokens= usage.completionTokens

            try {

              const [, assistantMessage] = appendResponseMessages({
                messages: [userMessage],
                responseMessages: response.messages,
              });

              await saveMessage(
                {
                  conversationId,
                  role: assistantMessage.role,
                  content: assistantMessage.content,
                  parts: assistantMessage.parts || [],
                  attachments: assistantMessage.experimental_attachments || [],
                  promptTokens,
                  completionTokens
                },
              );
            } catch (_) {
              console.error('Failed to save chat');
            }
        },
        onError: async (error) => {
          console.error("onError (v2) en /api/chat:", error, typeof error, JSON.stringify(error));
        }
  });

  return result.toDataStreamResponse();
}

async function getActiveConversationId(email: string, name: string, clientId: string) {
  const activeConversation= await getActiveConversation(email, clientId)
  if (activeConversation) {
    return activeConversation.id
  }
  // for use with chatwoot:
  // const contact= await getOrCreateContact(clientId, email, email)

  let contact= await getContactByPhone(email, clientId)

  if (!contact) {
    const contactFormValues: ContactFormValues= {
      clientId,
      phone: email,
      name: name,
      chatwootId: undefined,
      src: "simulator",
    }
    contact= await createContact(contactFormValues)
  }
  const created= await createConversation(email, clientId, contact.id, 0)
  return created.id
}
