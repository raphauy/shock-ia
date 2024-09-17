import { Client } from "@prisma/client";
import { Groq } from "groq-sdk";
import { ChatCompletion } from "groq-sdk/resources/chat/completions.mjs";
import { ChatCompletionCreateParams } from "openai/resources/index.mjs";
import { CompletionInitResponse, getAgentes, processFunctionCall } from "./functions";
import { getFullModelDAO, getFullModelDAOByName } from "./model-services";

export async function groqCompletionInit(client: Client, functions: ChatCompletionCreateParams.Function[], messages: ChatCompletion.Choice.Message[], modelName?: string): Promise<CompletionInitResponse | null> {

  if (!client.modelId) throw new Error("Client modelId not found")

  let model= modelName && await getFullModelDAOByName(modelName)
  if (!model) {
    model= await getFullModelDAO(client.modelId)
  }
  const provider= model.provider
  
  modelName= modelName || model.name
  
  const groq= new Groq({
    apiKey: provider.apiKey,    
  })

  console.log("messages:")
  messages?.map((message) => { console.log(message.role + ": " + message.content) })
  
  let completionResponse= null
  let agentes= false

  let baseArgs = {
    model: modelName,
    temperature: 0.1,
    messages
  }  
  const tools = functions.map((functionObj) => {
    return { 
        type: "function", 
        function: functionObj
    }
  })

  console.log("tools:")
  tools?.map((tool) => { console.log("   - " + tool.function?.name) }) 

  const args = functions.length > 0 ? { ...baseArgs, tools, tool_choice: "auto" } : baseArgs  

  try {

    const initialResponse = await groq.chat.completions.create(args as any);

    const usage= initialResponse.usage
    console.log("\tusage:")
    let promptTokens= usage?.prompt_tokens ? usage.prompt_tokens : 0 
    let completionTokens= usage?.completion_tokens ? usage.completion_tokens : 0
    console.log("\t\tpromptTokens: ", promptTokens)
    console.log("\t\tcompletionTokens: ", completionTokens)  


    const responseMessage = initialResponse.choices[0].message
    messages.push(responseMessage)

    const toolCalls = responseMessage.tool_calls
    let assistantResponse: string | null = ""


    if (toolCalls) {
      console.log("toolCalls!")

      const functionCall= toolCalls[0].function
      if (!functionCall) throw new Error("No function_call message")

      const name= functionCall.name
      if (!name) throw new Error("No name in function_call message")

      let args = JSON.parse(functionCall.arguments || "{}")

      const content= await processFunctionCall(client.id, name, args)

      const responseMessage= {
        "tool_call_id": toolCalls[0].id,
        "role": "tool",
        "name": name,
        "content": content
      }
      messages.push(responseMessage)
      agentes= await getAgentes(name)

      const stepResponse = await groqCompletionInit(client, functions, messages, modelName)
      if (!stepResponse) return null

      return {
        assistantResponse: stepResponse.assistantResponse,
        promptTokens: stepResponse.promptTokens + promptTokens,
        completionTokens: stepResponse.completionTokens + completionTokens,
        agentes: stepResponse.agentes || agentes
      }

    } else {
      console.log("\tsimple response!")      
      if (assistantResponse.includes("tool_call")) {
        assistantResponse= "Hubo un error al procesar el mensaje"
      } else {
        assistantResponse = initialResponse.choices[0].message.content
      }
      completionResponse= { assistantResponse, promptTokens, completionTokens, agentes }
      return completionResponse
    }
  } catch (error: any) {
    let assistantResponse = "Hubo un error al procesar el mensaje"
    console.log(error)
    const errorStr= (error as any).toString()
    if (errorStr.includes("429") || errorStr.includes("limit")) {
      console.log("429")
      assistantResponse+= " (L)"
    }
    completionResponse= { assistantResponse, promptTokens: 0, completionTokens: 0, agentes }
    return completionResponse
  }
}


