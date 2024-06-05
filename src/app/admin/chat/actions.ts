"use server"

import { getServiceNameByConversationId } from "@/services/carservice-services"
import { getActiveMessages } from "@/services/conversationService"
import { getSectionsOfMessage } from "@/services/section-services"
import { getSummitIdByConversationId } from "@/services/summit-services"


export async function getActiveMessagesAction(phone: string, clientId: string){
    const messages= await getActiveMessages(phone, clientId)
    return messages
}

export async function getSectionsOfMessageAction(messageId: string): Promise<string[]>{
    const sections= await getSectionsOfMessage(messageId)
    
    return sections.map((section) => section.sectionId)
}

export type CustomInfo = {
    narvaezId: string | undefined
    summitId: string | undefined
    carServiceName: string | undefined
}

export async function getCustomInfoAction(conversationId: string): Promise<CustomInfo>{
    const narvaezId= "narvaezId"
    const summitId= await getSummitIdByConversationId(conversationId)
    const carServiceName= await getServiceNameByConversationId(conversationId)

    const res= {
        narvaezId,
        summitId,
        carServiceName
    }

    return res
}
 