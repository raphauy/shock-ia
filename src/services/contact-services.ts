import { prisma } from "@/lib/db"
import * as z from "zod"
import { createDefaultStages, getFirstStageOfClient, StageDAO } from "./stage-services"

export type ContactDAO = {
	id: string
	chatwootId: string | undefined | null
	name: string
	phone: string | undefined | null
	imageUrl: string | null
	tags: String[]
	src: string
	order: number
	clientId: string
	stageId: string
	createdAt: Date
	updatedAt: Date
}

export const contactSchema = z.object({
	chatwootId: z.string().optional(),
	name: z.string().min(1, "name is required."),
	phone: z.string().optional(),
	imageUrl: z.string().optional(),
	src: z.string().min(1, "src is required."),
	clientId: z.string().min(1, "clientId is required."),
})

export type ContactFormValues = z.infer<typeof contactSchema>


export async function getContactsDAO(clientId: string) {
  const found = await prisma.contact.findMany({
    where: {
      clientId
    },
    orderBy: {
      id: 'asc'
    },
    include: {
			stage: true,
		}
  })
  return found as ContactDAO[]
}

export async function getContactDAO(id: string) {
  const found = await prisma.contact.findUnique({
    where: {
      id
    },
    include: {
			stage: true,
		}
  })
  return found as ContactDAO
}
    
export async function createContact(data: ContactFormValues) {

  // check if contact already exists
  const existingContact= await getContactByChatwootId(data.chatwootId || "")
  if (existingContact) {
    const updated= await updateContact(existingContact.id, data)
    return updated
  }

  let firstStage= await getFirstStageOfClient(data.clientId)
  if (!firstStage){
    console.log('No first stage found, creating default stages')
    await createDefaultStages(data.clientId)
    firstStage= await getFirstStageOfClient(data.clientId)
  }

  if (!firstStage) throw new Error('No first stage found')    

  const minOrder = await getMinOrderOfStage(firstStage.id)

  const created = await prisma.contact.create({
    data: {
      ...data,
      stageId: firstStage.id,
      order: minOrder - 1
    },
    include: {
			stage: true,
		},
  })
  return created
}

export async function getMinOrderOfStage(stageId: string) {
  const found = await prisma.contact.findFirst({
    where: {
      stageId
    },  
    orderBy: {
      order: 'asc'
    }
  })
  return found?.order || 0
}
export async function updateContact(id: string, data: ContactFormValues) {
  const updated = await prisma.contact.update({
    where: {
      id
    },
    data,
    include: {
			stage: true,
		},
  })
  return updated
}

export async function deleteContact(id: string) {
  const deleted = await prisma.contact.delete({
    where: {
      id
    },
    include: {
			stage: true,
		}
  })
  return deleted
}
    

export async function getFullContactsDAO() {
  const found = await prisma.contact.findMany({
    orderBy: {
      id: 'asc'
    },
    include: {
			client: true,
			stage: true,
		}
  })
  return found as ContactDAO[]
}
  
export async function getFullContactDAO(id: string) {
  const found = await prisma.contact.findUnique({
    where: {
      id
    },
    include: {
			client: true,
			stage: true,
		}
  })
  return found as ContactDAO
}
    
export async function getContactByChatwootId(chatwootId: string) {
  const found = await prisma.contact.findFirst({
    where: {
      chatwootId
    }
  })
  return found
}

export async function getContactsByStage(stageId: string) {
  const found = await prisma.contact.findMany({
    where: {
      stageId
    }
  })
  return found
}

export async function updateStageContacts(contacts: ContactDAO[]) {
  try {
    const transaction= contacts.map((contact) => 
      prisma.contact.update({
        where: { 
          id: contact.id,
          stage: {
            clientId: contact.clientId
          }
        },
        data: { 
          order: contact.order,
          stageId: contact.stageId
        }
      })
    )
    const updated = await prisma.$transaction(transaction)
    return updated
  } catch (error) {
    console.error(error)
    throw "Error al reordenar los contactos"
  }
}