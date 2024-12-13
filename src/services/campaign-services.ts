import { prisma } from "@/lib/db"
import { CampaignContactStatus, CampaignStatus, CampaignType } from "@prisma/client"
import { Client } from "@upstash/qstash"
import { format } from "date-fns"
import * as z from "zod"
import { createChatwootConversation, sendTextToConversation } from "./chatwoot"
import { getChatwootAccountId, getClient, getClientName, getClientOfCampaign, getWhatsappInstance } from "./clientService"
import { ContactDAOWithStage } from "./contact-services"
import { createConversation, getLastConversationByContactId, messageArrived } from "./conversationService"

const baseUrl= process.env.NEXTAUTH_URL === "http://localhost:3000" ? "https://local.rctracker.dev" : process.env.NEXTAUTH_URL
const client = new Client({ token: process.env.QSTASH_TOKEN! })

export type CampaignContactDAO = {
	id: string
	contact: ContactDAOWithStage
	campaignId: string
	status: CampaignContactStatus
  scheduleId: string | null | undefined
  sentAt: Date | null | undefined
	scheduledAt: Date | null | undefined
	scheduledTo: Date | null | undefined
	createdAt: Date
	updatedAt: Date
}

export type CampaignDAO = {
	id: string
	type: CampaignType
	name: string
	status: CampaignStatus
	message: string
	clientId: string
	contacts: CampaignContactDAO[]
	createdAt: Date
	updatedAt: Date
}

export const campaignSchema = z.object({
	type: z.nativeEnum(CampaignType),
	name: z.string().min(1, "name is required."),
	clientId: z.string().min(1, "clientId is required."),
})

export type CampaignFormValues = z.infer<typeof campaignSchema>


export async function getCampaignsDAO(clientId: string) {
  const found = await prisma.campaign.findMany({
    where: {
      clientId
    },
    orderBy: {
      id: 'asc'
    },
    include: {
      contacts: {
        include: {
          contact: {
            include: {
              stage: true
            }
          }
        }
      }
    }
  })
  return found as CampaignDAO[]
}

export async function getCampaignDAO(id: string) {
  const found = await prisma.campaign.findUnique({
    where: {
      id
    },
    include: {
      contacts: {
        orderBy: {
          contact: {
            updatedAt: 'desc'
          }
        },
        include: {
          contact: {
            include: {
              stage: true
            }
          },          
        }
      },
    },
  })
  return found as CampaignDAO
}
    
export async function createCampaign(data: CampaignFormValues) {
  const created = await prisma.campaign.create({
    data: {
      ...data,
      status: CampaignStatus.CREADA
    }
  })
  return created
}

export async function updateCampaign(id: string, data: CampaignFormValues) {
  const updated = await prisma.campaign.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function setCampaignStatus(campaignId: string, status: CampaignStatus) {
  const updated = await prisma.campaign.update({
    where: {
      id: campaignId
    },
    data: {
      status
    }
  })
  return updated
}

export async function deleteCampaign(id: string) {
  const deleted = await prisma.campaign.delete({
    where: {
      id
    },
  })
  return deleted
}

export async function addContactsToCampaign(campaignId: string, contactIds: string[]) {
  const created = await prisma.campaignContact.createMany({
    data: contactIds.map(contactId => ({ 
      campaignId, 
      contactId 
    }))
  })
  return created
}

export async function removeAllContactsFromCampaign(campaignId: string) {
  const deleted = await prisma.campaignContact.deleteMany({
    where: { 
      campaignId, 
    }
  })
  return deleted
}

export async function setMessageToCampaign(campaignId: string, message: string) {
  const updated = await prisma.campaign.update({
    where: {
      id: campaignId
    },
    data: {
      message
    }
  })
  return updated
}

export async function processCampaignContact(campaignContactId: string) {
  const campaignContact = await prisma.campaignContact.findUnique({
    where: {
      id: campaignContactId
    },
    include: {
      contact: true,
      campaign: true
    }
  })
  if (!campaignContact) throw new Error("Contacto no encontrado")
  if (campaignContact.status === CampaignContactStatus.ENVIADO) return campaignContact
  if (campaignContact.status !== CampaignContactStatus.PROGRAMADO && campaignContact.status !== CampaignContactStatus.PENDIENTE) throw new Error("Contacto no está en estado PROGRAMADO o PENDIENTE")

  const contact = campaignContact.contact
  const messageTemplate = campaignContact.campaign.message
  const name= contact.name || "usuario"
  const message= messageTemplate.replace("{{nombre}}", name)
  const campaign = campaignContact.campaign

  console.log("contact: ", contact)
  console.log("phone: ", contact.phone)
  console.log("message: ", message)

  const phone= contact.phone
//  const phoneRegex= /^\+?[0-9]+$/
//  if (!phone || !phoneRegex.test(phone)) throw new Error("Contacto no tiene teléfono válido")

  console.log("phone: ", phone)
  const chatwootAccountId= await getChatwootAccountId(campaign.clientId)
  if (!chatwootAccountId) throw new Error("Chatwoot account not found")
  console.log("chatwootAccountId: ", chatwootAccountId)

  let conversation= await getLastConversationByContactId(contact.id, campaign.clientId)
  if (!conversation || conversation.contactId !== contact.id) {
    const whatsappInstance= await getWhatsappInstance(campaign.clientId)
    if (!whatsappInstance) throw new Error("Whatsapp instance not found")
    if (!whatsappInstance.whatsappInboxId) throw new Error("Whatsapp inbox not found")
    if (!contact.chatwootId) throw new Error("Chatwoot contact not found")
    const chatwootConversationId= await createChatwootConversation(Number(chatwootAccountId), whatsappInstance.whatsappInboxId, contact.chatwootId)
    if (!chatwootConversationId) throw new Error("Chatwoot conversation not found")
    conversation= await createConversation(phone, campaign.clientId, contact.id, chatwootConversationId)
  }

  if (!conversation) throw new Error("Conversation not found")

  const assistantMessage= "Información del sistema: A través de una campaña el usuario recibió el siguiente mensaje:\n\n" + message
  await messageArrived(conversation.phone, assistantMessage, conversation.clientId, "assistant", "", undefined, undefined, conversation.chatwootConversationId || undefined, Number(contact.chatwootId))
    
  const chatwootConversationId= conversation.chatwootConversationId
  if (!chatwootConversationId) throw new Error("Chatwoot conversation not found")

  await sendTextToConversation(Number(chatwootAccountId), chatwootConversationId, message)

  const updated = await prisma.campaignContact.update({
    where: {
      id: campaignContactId
    },
    data: {
      conversationId: conversation.id,
      status: CampaignContactStatus.ENVIADO,
      sentAt: new Date(),
    }
  })

  if (!updated) throw new Error("Error al procesar el contacto")

  return updated
}

export async function setCampaignContactStatus(campaignContactId: string, status: CampaignContactStatus) {
  const updated = await prisma.campaignContact.update({
    where: {
      id: campaignContactId
    },
    data: {
      status
    }
  })
  return updated
}

export async function processCampaign(campaignId: string) {
  
  const MAX_CONTACTS_TO_PROCESS = 1

  // get MAX_CONTACTS_TO_PROCESS contacts ids with status PENDIENTE
  const campaignContacts = await prisma.campaignContact.findMany({
    where: {
      campaignId,
      status: CampaignContactStatus.PENDIENTE
    },
    take: MAX_CONTACTS_TO_PROCESS,
    select: {
      id: true,
      campaign: {
        select: {
          clientId: true
        }
      }
    }
  })

  if (campaignContacts.length === 0) {
    console.log("No hay contactos pendientes para procesar")
    // update campaign status to COMPLETADA
    await setCampaignStatus(campaignId, CampaignStatus.COMPLETADA)
    return true
  }

  console.log(`Procesando ${campaignContacts.length} contactos...`)

  const client= await getClientOfCampaign(campaignId)
  if (!client) throw new Error("Client not found")

  const delayIncrement = client.wapSendFrequency
  console.log("delayIncrement: ", delayIncrement)

  let actualDelay = delayIncrement

  for (const campaignContact of campaignContacts) {
    const now= new Date()
    console.log("now: ", format(now, "yyyy-MM-dd HH:mm:ss"))

    const notBeforeDate= new Date(now.getTime() + actualDelay * 1000)
    console.log("notBeforeDate: ", format(notBeforeDate, "yyyy-MM-dd HH:mm:ss"))

    const notBefore= Math.floor(notBeforeDate.getTime() / 1000)    
    console.log("notBefore: ", notBefore)

    const scheduleId= await scheduleCampaignContact(campaignContact.id, notBefore, client.name)
    await prisma.campaignContact.update({
      where: {
        id: campaignContact.id
      },
      data: {
        scheduleId,
        scheduledAt: new Date(),
        scheduledTo: notBeforeDate,
        status: CampaignContactStatus.PROGRAMADO
      }
    })
    actualDelay += delayIncrement
  }

  // update campaign status to COMPLETADA
  await setCampaignStatus(campaignId, CampaignStatus.COMPLETADA)
  console.log("Campaign status updated to COMPLETADA")

  return true
}

async function scheduleCampaignContact(campaignContactId: string, notBefore: number, clientName: string) {
  const result= await client.publishJSON({
    url: `${baseUrl}/api/process-campaign-message`,
    body: {
      campaignContactId,
      clientName
    },
    notBefore,
    retries: 0
  })
  console.log("Upstash result: ", result)
  
  return result.messageId
}