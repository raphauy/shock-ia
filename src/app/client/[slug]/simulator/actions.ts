"use server"

import { DataClient } from "@/app/admin/clients/(crud)/actions"
import { getCurrentUser } from "@/lib/auth"
import { getClientBySlug } from "@/services/clientService"
import { getMessagesCountOfActiveConversation, messageArrived, processMessage } from "@/services/conversationService"
import { getFullModelDAOByName } from "@/services/model-services"

export async function insertMessageAction(text: string, clientId: string, modelName: string) {

    const currentUser= await getCurrentUser()
    const phone= currentUser?.email || "web-chat"

    const actualMessagesCount= await getMessagesCountOfActiveConversation(phone, clientId)
    console.log("actualMessagesCount: ", actualMessagesCount)

    const created= await messageArrived(phone, text, clientId, "user", "")
    await new Promise(resolve => setTimeout(resolve, 500))
    await processMessage(created.id, modelName)

    // check every 2 seconds the new actualMessagesCount until it is equal to the previous one plus 3
    // the max amount of time is 1 minute
    let actualMessagesCount2= actualMessagesCount
    let time= 0
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      time+= 2000
      if (time > 60000) {
        console.log("timeout")        
        break
      }
      actualMessagesCount2= await getMessagesCountOfActiveConversation(phone, clientId)
      console.log("actualMessagesCount2: ", actualMessagesCount2)      
      if (actualMessagesCount2 === actualMessagesCount + 3) {
        break
      }
    }


    return "ok"
}

export async function getDataClientWithModel(slug: string, modelName?: string): Promise<DataClient | null>{ 
    
  const client= await getClientBySlug(slug)
  if (!client) return null

  let model= client.model
  if (modelName) {
    model= await getFullModelDAOByName(modelName)
  }
  const promptCostTokenPrice= model?.inputPrice || 0
  const completionCostTokenPrice= model?.outputPrice || 0

  const propertiesCount= 0

  const data: DataClient= {
      id: client.id,
      nombre: client.name,
      slug: client.slug,
      descripcion: client.description || '',
      whatsappNumbers: client.whatsappNumbers || '',
      url: client.url || '',
      modelId: client.modelId,
      cantPropiedades: propertiesCount,
      whatsAppEndpoint: client.whatsappEndpoint,
      prompt: client.prompt,
      promptTokensPrice: client.promptTokensPrice,
      completionTokensPrice: client.completionTokensPrice,
      promptCostTokenPrice,
      completionCostTokenPrice,
      modelName: model && model.name ? model.name : '',
  }
  return data
}