import { getFullModelDAO } from '@/services/model-services';
import { getCurrentUser } from '@/lib/auth';
import { getClient } from '@/services/clientService';
import { createConversation, getActiveConversation, getSystemMessage } from '@/services/conversationService';
import { getFullModelDAOByName } from '@/services/model-services';
import { getStageByChatwootId } from '@/services/stage-services';
import { openai } from '@ai-sdk/openai';
import { appendResponseMessages, streamText } from 'ai';
import { NextResponse } from 'next/server';
import { getContext } from '@/services/function-call-services';
import { getRepositorysDAO } from '@/services/repository-services';
import { getDocumentTool } from '@/lib/ai/tools';
import { getMostRecentUserMessage } from '@/lib/ai/chat-utils';
import { MessageFormValues, saveMessage, saveMessages } from '@/services/messages-service';
import { ContactFormValues, createContact, getContactByPhone, getOrCreateContact } from '@/services/contact-services';

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
  
    const { messages, clientId, modelName } = await req.json()
  
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
  
    let model= modelName && await getFullModelDAOByName(modelName)
    if (!model) {
      model= await getFullModelDAO(client.modelId)
    }
    const provider= model.provider
    
    if (!provider.streaming || !model.streaming) return NextResponse.json({ error: "Proveedor o modelo no soporta streaming" }, { status: 502 })

    // save the input  as user  role with messageArrived
    //const userMessageStored= await messageArrived(phone, userMessage.content, client.id, "user", "")
    const conversationId= await getActiveConversationId(email, currentUser.name || email, client.id)
    const messageFormValues: MessageFormValues= {
      conversationId,
      role: "user",
      content: userMessage.content,
      parts: userMessage.parts || [],
      attachments: userMessage.experimental_attachments || [],
    }
    await saveMessage(messageFormValues)

    const contextResponse= await getContext(clientId, email, "TODO: remove this")
  
    const systemMessage= getSystemMessage(client.prompt, contextResponse.contextString)
  
    console.log("messages.count: " + messages.length)
    console.log("messages: " + JSON.stringify(messages))  

    const repositories= await getRepositorysDAO(client.id)
    let dynamicTools= {}
    for (const repository of repositories) {
        console.log("repository: " + repository.name)
    //   const tool= await getToolFromDatabase(repository.id)
    //   console.log("Tool of:", repository.name)
    //   dynamicTools= {
    //     ...dynamicTools,
    //     ...tool
    //   }
    }
    console.log("dynamicTools tools count:", Object.keys(dynamicTools).length)

    const tools= {
        ...getDocumentTool,
        ...dynamicTools
    }
    console.log("tools count:", Object.keys(tools).length)

    const result = streamText({
        model: openai('gpt-4.1'),
        temperature: 0,
        maxSteps: 10,
        system: systemMessage.content,
        messages: messages,
        tools,
        onStepFinish: async ({text, toolCalls, toolResults, finishReason, usage, stepType}) => {
            console.log("--------------------------------")
            console.log("[onStepFinish] stepType: " + stepType)
            console.log("[onStepFinish] finishReason: " + finishReason)
            console.log("[onStepFinish] text: " + text)
            console.log("[onStepFinish] toolCalls: " + JSON.stringify(toolCalls))
            console.log("[onStepFinish] toolResults count: " + toolResults.length)
            console.log("[onStepFinish] usage: " + JSON.stringify(usage))

            // const  promptTokens= usage.promptTokens
            // const completionTokens= usage.completionTokens
            // console.log(`Prompt token count: ${promptTokens}`)
            // console.log(`Completion token count: ${completionTokens}`)

            // if (finishReason === "stop") {
            //     const messageStored= await messageArrived(phone, text, client.id, "assistant", "", promptTokens, completionTokens)
            //     if (messageStored) console.log("assistant message stored")
            // }

            // if (finishReason === "tool-calls") {
            //     console.log("saving tool calls...")
            //     await saveToolCalls(phone, toolCalls, client.id, promptTokens, completionTokens)        
            // }
        },
        onFinish: async ({usage, response}) => {
            console.log("--------------------------------")
            console.log("[onFinish] usage: " + JSON.stringify(usage))
            console.log("[onFinish] response: " + JSON.stringify(response, null, 3))
            const promptTokens= usage.promptTokens
            const completionTokens= usage.completionTokens

            try {

              const [, assistantMessage] = appendResponseMessages({
                messages: [userMessage],
                responseMessages: response.messages,
              });

              await saveMessages(
                [
                  {
                    conversationId,
                    role: assistantMessage.role,
                    content: assistantMessage.content,
                    parts: assistantMessage.parts || [],
                    attachments: assistantMessage.experimental_attachments || [],
                    promptTokens,
                    completionTokens
                  },
                ],
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
