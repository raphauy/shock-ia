import { messageArrived, saveFunction, saveToolCalls } from '@/services/conversationService';
import { getFullModelDAO } from '@/services/model-services';
import { getCurrentUser } from '@/lib/auth';
import { getClient } from '@/services/clientService';
import { getActiveMessages, getSystemMessage } from '@/services/conversationService';
import { getFullModelDAOByName } from '@/services/model-services';
import { getStageByChatwootId } from '@/services/stage-services';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';
import { getContext } from '@/services/function-call-services';
import { setSectionsToMessage } from '@/services/section-services';
import { getRepositorysDAO } from '@/services/repository-services';
import { getDocumentTool } from '@/lib/ai/tools';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const currentUser= await getCurrentUser()
    const phone= currentUser?.email || "web-chat"
  
    const { messages: origMessages, clientId, modelName } = await req.json()
  
    // Validar que clientId exista
    if (!clientId) {
      return new Response("Client ID is required", { status: 400 })
    }
    
    //const messages= origMessages.filter((message: any) => message.role !== "system")
    let messages= await getActiveMessages(phone, clientId)
    if (!messages) messages= []
    messages= messages.filter((message: any) => message.role !== "system")
  
    // filter messages with role function and functionName getDocument
    messages= messages.filter((message: any) => message.role !== "system")
    // get rid of messages with role function and functionName getDocument
    messages= messages.filter((message: any) => message.role !== "function" || (message.content !== "getDocument" && message.content !== "getSection"))
    console.log("messages: " + JSON.stringify(messages))
  
    const apiMessages= messages.map((message: any) => {
      const role= message.role
      if (role === "function") 
        return {
          role: message.role,
          content: message.content,
          name: message.gptData ? JSON.parse(message.gptData).functionName : null
        }
    
      return {
        role: message.role,
        content: message.content,
      }
    })
    
  
    const client= await getClient(clientId)
    if (!client) {
      return new Response("Client not found", { status: 404 })
    }
    if (!client.prompt) {
      return new Response("Client prompt not found", { status: 404 })
    }
  
  
    const stage= await getStageByChatwootId(phone, clientId)
    if (stage && !stage.isBotEnabled) {
      return new Response("Bot disabled", { status: 404 })
    }
  
    // get rid of messages of type system
    //const input= messages[messages.length - 1].content
    const input= origMessages[origMessages.length - 1].content
    console.log("input: " + input)
    // attach the input to the messages
    apiMessages.push({ role: "user", content: input } as any)
  
    if (!client.modelId) return NextResponse.json({ message: "Este cliente no tiene modelo asignado" }, { status: 502 })
  
    let model= modelName && await getFullModelDAOByName(modelName)
    if (!model) {
      model= await getFullModelDAO(client.modelId)
    }
    const provider= model.provider
    
    if (!provider.streaming || !model.streaming) return NextResponse.json({ error: "Proveedor o modelo no soporta streaming" }, { status: 502 })

    // save the input  as user  role with messageArrived
    await messageArrived(phone, input, client.id, "user", "")

    const contextResponse= await getContext(clientId, phone, input)
    //console.log("contextContent: " + removeSectionTexts(contextResponse.contextString))
  
    const systemMessage= getSystemMessage(client.prompt, contextResponse.contextString)
    apiMessages.unshift(systemMessage as any)
    const created= await messageArrived(phone, systemMessage.content, client.id, "system", "")
    await setSectionsToMessage(created.id, contextResponse.sectionsIds)
  
    console.log("apiMessages.count: " + apiMessages.length)
    console.log("apiMessages: " + JSON.stringify(apiMessages))  
    console.log("origMessages: " + JSON.stringify(origMessages))

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
        messages: apiMessages,
        tools,
        onStepFinish: async ({text, toolCalls, toolResults, finishReason, usage, stepType}) => {
            console.log("--------------------------------")
            console.log("[onStepFinish] stepType: " + stepType)
            console.log("[onStepFinish] finishReason: " + finishReason)
            console.log("[onStepFinish] text: " + text)
            console.log("[onStepFinish] toolCalls: " + JSON.stringify(toolCalls))
            console.log("[onStepFinish] toolResults count: " + toolResults.length)
            console.log("[onStepFinish] usage: " + JSON.stringify(usage))

            const  promptTokens= usage.promptTokens
            const completionTokens= usage.completionTokens
            console.log(`Prompt token count: ${promptTokens}`)
            console.log(`Completion token count: ${completionTokens}`)

            if (finishReason === "stop") {
                const messageStored= await messageArrived(phone, text, client.id, "assistant", "", promptTokens, completionTokens)
                if (messageStored) console.log("assistant message stored")
            }

            if (finishReason === "tool-calls") {
                console.log("saving tool calls...")
                await saveToolCalls(phone, toolCalls, client.id, promptTokens, completionTokens)        
            }
        },
        onFinish: async ({usage}) => {
            console.log("--------------------------------")
            console.log("[onFinish] usage: " + JSON.stringify(usage))
        }
    });

  return result.toDataStreamResponse();
}