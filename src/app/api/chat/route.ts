import { getCurrentUser } from "@/lib/auth"
import { getClient } from "@/services/clientService"
import { getActiveMessages, getSystemMessage, messageArrived, saveFunction } from "@/services/conversationService"
import { getContext } from "@/services/function-call-services"
import { getFunctionsDefinitions } from "@/services/function-services"
import { processFunctionCall } from "@/services/functions"
import { getFullModelDAO, getFullModelDAOByName } from "@/services/model-services"
import { setSectionsToMessage } from "@/services/section-services"
import { getStageByChatwootId } from "@/services/stage-services"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { NextResponse } from "next/server"
import { OpenAI } from "openai"
//import openaiTokenCounter from 'openai-gpt-token-counter'

export const maxDuration = 299
export const dynamic = 'force-dynamic'


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
  // for (let i = 0; i < messages.length; i++) {
  //   if (messages[i].role === "function") {
  //     console.log("raw gptData: " + messages[i].gptData)
  //     const gptData= messages[i].gptData ? JSON.parse(messages[i].gptData || "{}") : null
  //     const isDocumentFunction= gptData && gptData.functionName ? gptData.functionName === "getDocument" : false
  //     console.log("gptData: " + JSON.stringify(gptData))
  //     if (!isDocumentFunction) {
  //       messages[i].role = "system"
  //     } else {
        
  //       messages[i].name= gptData.functionName
  //     }
  //   }
  // }

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
  

  console.log("apiMessages: " + JSON.stringify(apiMessages))

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

  const contextResponse= await getContext(clientId, phone, input)
  //console.log("contextContent: " + removeSectionTexts(contextResponse.contextString))

  const systemMessage= getSystemMessage(client.prompt, contextResponse.contextString)
  apiMessages.unshift(systemMessage as any)
  const created= await messageArrived(phone, systemMessage.content, client.id, "system", "")
  await setSectionsToMessage(created.id, contextResponse.sectionsIds)

  console.log("apiMessages.count: " + apiMessages.length)

  const functions= await getFunctionsDefinitions(clientId)

  functions.forEach((functionDefinition) => {
    console.log("functionDefinition: " + functionDefinition.name);
  })

  console.log("model: " + model.name)
  
  const openai = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseUrl
  })
  
  // Inicializa el objeto de argumentos con propiedades comunes
  let baseArgs = {
    model: model.name,
    temperature: 0,
    stream: true,
  };
  let promptTokens= 0
  let completionTokens= 0

  // @ts-ignore
  baseArgs = { ...baseArgs, messages: apiMessages }

  // Si el array de functions tiene al menos un elemento, añade el parámetro functions
  const args = functions.length > 0 ? { ...baseArgs, functions: functions, function_call: "auto" } : baseArgs;

  // Ahora args contiene el parámetro functions solo si el array no estaba vacío
  const initialResponse = await openai.chat.completions.create(args as any);

  // @ts-ignore
  const stream = OpenAIStream(initialResponse, {
    experimental_onFunctionCall: async (
      { name, arguments: args,  },
      createFunctionCallMessages,
    ) => {
//      const result = await runFunction(name, args, clientId);
      const result = await processFunctionCall(clientId, name, args);
      const newMessages = createFunctionCallMessages(result);

      let baseArgs = {
        model: model.name,
        stream: true,
      };
    
      // @ts-ignore
      baseArgs = { ...baseArgs, messages: [...apiMessages, ...newMessages] };
      const recursiveArgs = functions.length > 0 ? { ...baseArgs, functions: functions, function_call: "auto" } : baseArgs;

      return openai.chat.completions.create(recursiveArgs as any);

    },
    onStart: async () => {
      console.log("start")
      const text= apiMessages[apiMessages.length - 1].content
      console.log("text: " + text)
      
      const messageStored= await messageArrived(phone, text, client.id, "user", "")
      if (messageStored) console.log("user message stored")

    },
    onCompletion: async (completion) => {
      console.log("completion: ", completion)

      // const partialPromptToken = openaiTokenCounter.chat(apiMessages, "gpt-4") + 1
      // console.log(`\tPartial prompt token count: ${partialPromptToken}`)      
      // promptTokens += partialPromptToken

      const completionMessages = [
        { role: "assistant", content: completion },
      ]
      // const partialCompletionTokens = openaiTokenCounter.chat(completionMessages, "gpt-4")
      // console.log(`\tPartial completion token count: ${partialCompletionTokens}`)
      // completionTokens += partialCompletionTokens

      if (!completion.includes("function_call")) {
        console.log(`Prompt token count: ${promptTokens}`)
        console.log(`Completion token count: ${completionTokens}`)
        const messageStored= await messageArrived(phone, completion, client.id, "assistant", "", promptTokens, completionTokens)
        if (messageStored) console.log("assistant message stored")
      } else {
        console.log(JSON.stringify(completion))        
        await saveFunction(phone, completion, client.id)
      }
    },
  });



  return new StreamingTextResponse(stream);
}
