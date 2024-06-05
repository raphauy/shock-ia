import { Client } from "@prisma/client"
import { GoogleGenerativeAI, Content, FunctionDeclarationsTool, FunctionDeclaration } from "@google/generative-ai"
import { ChatCompletionCreateParams, ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { CompletionInitResponse, getAgentes, processFunctionCall } from "./functions"
import { getFullModelDAO, getFullModelDAOByName } from "./model-services"

export async function googleCompletionInit(client: Client, functions: ChatCompletionCreateParams.Function[], messages: ChatCompletionMessageParam[], systemMessage: string, modelName?: string): Promise<CompletionInitResponse | null> {

  // filter messages to keep only user and assistant messages
  messages= messages.filter((message) => message.role === "user" || message.role === "assistant")

  if (!client.modelId) throw new Error("Client modelId not found")

  let model= modelName && await getFullModelDAOByName(modelName)
  if (!model) {
    model= await getFullModelDAO(client.modelId)
  }
  const provider= model.provider

  modelName= modelName || model.name
  
  const genAI = new GoogleGenerativeAI(provider.apiKey)
  const googleModel = genAI.getGenerativeModel({ model: modelName })

  let completionResponse= null
  let promptTokens= 0
  let completionTokens= 0
  let agentes= false


  // messages array have the input in the last message
  const input= messages[messages.length - 1].content as string
  console.log("\tinput: ", input)
  // remove the last message from the messages array
  messages.pop()

  const headMessages=initChat(systemMessage)

  const tailMessages= messages.map((message) => ({
    role: transformRoles(message.role),
    parts: [{ text: message.content as string }],
  }))

  const history= [...headMessages, ...tailMessages]

  //console.log("history: ", history)
  // log history with depth of 2
  history.map((message) => console.log(message.role, ": ", message.parts[0].text), "\n")  

  const generationConfig= {
    temperature: 0,
    max_output_tokens: 100000000,
  }

  const functionDeclarations = functions.map((functionObj) => {
    return { 
        name: functionObj.name,
        description: functionObj.description,
        parameters: functionObj.parameters,
    } as FunctionDeclaration
  }) 

  const tools= [{functionDeclarations}] 
  console.log("tools: ")
  tools[0].functionDeclarations.map((functionDeclaration) => console.log("   - " + functionDeclaration.name))
  
  

  try {
    const chat= googleModel.startChat({ history, generationConfig, tools })

    let result= await chat.sendMessage(input)
    let response= result.response

    let functionCall= null
    if (response.candidates && response.candidates.length > 0) {
      functionCall = response.candidates[0].content.parts[0].functionCall
    } else {
      console.log("No candidates")    
    }

    const text= response.text()
    console.log("\tresponse: ", text)

    const msgContent = { role: "user", parts: [{ text: input }] };
    const contents = [...history, msgContent];
    const { totalTokens } = await googleModel.countTokens({ contents });
    promptTokens= totalTokens
    const { totalTokens: totalCompletionTokens } = await googleModel.countTokens(text);
    completionTokens= totalCompletionTokens

    if (response.candidates && functionCall) {
      console.log("wantsToUseFunction!")
      console.log(functionCall)
      
      
      const name = functionCall.name
      const args = functionCall.args
      const content = await processFunctionCall(client.id, name, args)
      messages.push({
        role: "assistant",
        content: response.candidates[0].content.parts[0].text,
      })
      messages.push({
        role: "function",
        name,
        content,
      })
      agentes = getAgentes(name)

      const functionResponse = {
        functionResponse: {
          name,
          response: {
            name,
            content,
          },
        },
      }

      result= await chat.sendMessage([functionResponse])
      response= result.response

      const text= response.text()
      console.log("\tresponse: ", text)
    
      const { totalTokens } = await googleModel.countTokens(content);
      promptTokens+= totalTokens
      const { totalTokens: totalCompletionTokens } = await googleModel.countTokens(text);
      completionTokens+= totalCompletionTokens

      console.log("\tfunction call response!")      
      const assistantResponse = text
      completionResponse= { assistantResponse, promptTokens, completionTokens, agentes }
      return completionResponse  

    } else {
    
      console.log("\tsimple response!")      
      const assistantResponse = text
      completionResponse= { assistantResponse, promptTokens, completionTokens, agentes }
      return completionResponse  
    }

  } catch (error) {
      console.log(error)
      const assistantResponse = "Hubo un error al procesar el mensaje"
      completionResponse= { assistantResponse, promptTokens, completionTokens, agentes }
      return completionResponse  
    }


}



function transformRoles(role: string): string {
  switch (role) {
    case "user":
      return "user"
    case "assistant":
      return "model"
    case "function":
      return "function"
    case "system":
      return "system"
    default:
      return "user"
  }
  
}

function initChat(systemMessage: string): Content[] {
  const firstMessage= "Quiero que te comportes de la siguiente manera: \n\n" + systemMessage
  console.log(firstMessage)
  
  return [
    { role: "user", parts: [{ text: firstMessage }] },
    { role: "model", parts: [{ text: "entendido" }] },
  ]  
}



// "tools": [
//   {
//     "function_declarations": [
//       {
//         "name": "find_movies",
//         "description": "find movie titles currently playing in theaters based on any description, genre, title words, etc.",
//         "parameters": {
//           "type": "object",
//           "properties": {
//             "location": {
//               "type": "string",
//               "description": "The city and state, e.g. San Francisco, CA or a zip code e.g. 95616"
//             },
//             "description": {
//               "type": "string",
//               "description": "Any kind of description including category or genre, title words, attributes, etc."
//             }
//           },
//           "required": [
//             "description"
//           ]
//         }
//       },
//       {
//         "name": "find_theaters",
//         "description": "find theaters based on location and optionally movie title which is currently playing in theaters",
//         "parameters": {
//           "type": "object",
//           "properties": {
//             "location": {
//               "type": "string",
//               "description": "The city and state, e.g. San Francisco, CA or a zip code e.g. 95616"
//             },
//             "movie": {
//               "type": "string",
//               "description": "Any movie title"
//             }
//           },
//           "required": [
//             "location"
//           ]
//         }
//       },
//       {
//         "name": "get_showtimes",
//         "description": "Find the start times for movies playing in a specific theater",
//         "parameters": {
//           "type": "object",
//           "properties": {
//             "location": {
//               "type": "string",
//               "description": "The city and state, e.g. San Francisco, CA or a zip code e.g. 95616"
//             },
//             "movie": {
//               "type": "string",
//               "description": "Any movie title"
//             },
//             "theater": {
//               "type": "string",
//               "description": "Name of the theater"
//             },
//             "date": {
//               "type": "string",
//               "description": "Date for requested showtime"
//             }
//           },
//           "required": [
//             "location",
//             "movie",
//             "theater",
//             "date"
//           ]
//         }
//       }
//     ]
//   }
// ]