import { prisma } from "@/lib/db"
import { CampaignContactStatus, CampaignStatus, CampaignType } from "@prisma/client"
import * as z from "zod"
import { ContactDAOWithStage, getContactDAO } from "./contact-services"
import { Client } from "@upstash/qstash"
import { format } from "date-fns"

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
  const message = campaignContact.campaign.message
  const campaign = campaignContact.campaign

  console.log("contact: ", contact)
  console.log("message: ", message)
  console.log("campaign: ", campaign)

  const updated = await prisma.campaignContact.update({
    where: {
      id: campaignContactId
    },
    data: {
      status: CampaignContactStatus.ENVIADO,
      sentAt: new Date()
    }
  })

  if (!updated) throw new Error("Error al procesar el contacto")

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
      id: true
    }
  })

  if (campaignContacts.length === 0) {
    console.log("No hay contactos pendientes para procesar")
    // update campaign status to COMPLETADA
    await prisma.campaign.update({
      where: {
        id: campaignId
      },
      data: {
        status: CampaignStatus.COMPLETADA
      }
    })
    return true
  }

  console.log(`Procesando ${campaignContacts.length} contactos...`)

  const delayIncrement = 30
  let actualDelay = delayIncrement

  for (const campaignContact of campaignContacts) {
    const now= new Date()
    console.log("now: ", format(now, "yyyy-MM-dd HH:mm:ss"))

    const notBeforeDate= new Date(now.getTime() + actualDelay * 1000)
    console.log("notBeforeDate: ", format(notBeforeDate, "yyyy-MM-dd HH:mm:ss"))

    const notBefore= Math.floor(notBeforeDate.getTime() / 1000)    
    console.log("notBefore: ", notBefore)

    const scheduleId= await scheduleCampaignContact(campaignContact.id, notBefore)
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

  console.log("Fin de iteración")

  return true
}

async function scheduleCampaignContact(campaignContactId: string, notBefore: number) {
  const result= await client.publishJSON({
    url: `${baseUrl}/api/process-campaign-message`,
    body: {
      campaignContactId
    },
    notBefore
  })
  console.log("Upstash result: ", result)
  
  return result.messageId
}