import * as z from "zod"
import { prisma } from "@/lib/db"
import { CampaignStatus, CampaignType } from "@prisma/client"
import { ContactDAO } from "./contact-services"

export type CampaignContactDAO = {
	id: string
	contact: ContactDAO
	campaignId: string
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
          contact: true
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
        include: {
          contact: true
        }
      },
    }
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

export async function removeContactsFromCampaign(campaignId: string, contactIds: string[]) {
  const deleted = await prisma.campaignContact.deleteMany({
    where: { 
      campaignId, 
      contactId: { 
        in: contactIds 
      } 
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