import { prisma } from "@/lib/db"
import { ContactEventType } from "@prisma/client"
import * as z from "zod"
import { createContactEvent } from "./contact-event-services"
import { createDefaultStages, getFirstStageOfClient, StageDAO } from "./stage-services"

export type ContactDAO = {
	id: string
	chatwootId: string | undefined | null
	name: string
	phone: string | undefined | null
	imageUrl: string | null
	tags: string[]
	src: string
	order: number
	clientId: string
	stageId: string
	createdAt: Date
	updatedAt: Date
}

export type ContactDAOWithStage = ContactDAO & {
	stage: StageDAO
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
  const existingContact= await getContactByChatwootId(data.chatwootId || "", data.clientId)
  if (existingContact) {
    const updated= await updateContact(existingContact.id, data)
    return updated
  }

  console.log("createContact: ", data)


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
  if (!created) throw new Error('Error creating contact')
  await createContactEvent(ContactEventType.CREATED, undefined, undefined, created.id)

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
  if (!updated) throw new Error("Error al actualizar el contacto")
  
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
    
export async function getContactByChatwootId(chatwootId: string, clientId: string) {
  const found = await prisma.contact.findFirst({
    where: {
      chatwootId,
      clientId
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

export async function setNewStage(contactId: string, stageId: string, by: string | undefined) {
  // get the first order and then substract one
  const firstOrder= await getMinOrderOfStage(stageId)
  const order= firstOrder - 1
  const updated= await prisma.contact.update({
    where: {
      id: contactId
    },
    data: {
      stageId,
      order
    },
    include: {
      stage: true,
    }
  })
  if (!updated) throw new Error("Error al actualizar el estado del contacto")

  await createContactEvent(ContactEventType.MOVED_TO_STAGE, updated.stage.name, by, contactId)
  return updated
}

export async function getContactByPhone(phone: string, clientId: string) {
  const found = await prisma.contact.findFirst({
    where: {
      phone,
      clientId
    },
    include: {
      stage: true,
    }
  })
  return found
}

export async function getTagsOfContact(contactId: string) {
  const contact= await getContactDAO(contactId)
  return contact?.tags || []
}

export async function setTagsOfContact(contactId: string, tags: string[], by: string | undefined) {
  console.log("setting tags: ", tags)
  const contact= await getContactDAO(contactId)
  const contactTags= contact?.tags || []
  const updated= await prisma.contact.update({
    where: { id: contactId },
    data: { tags }
  })
  if (updated) {
    manageContactEvent(contactId, contactTags, tags, by)
  }
  return updated
}

async function manageContactEvent(contactId: string, contactTags: string[], newTags: string[], by: string | undefined) {
  const addedTags= newTags.filter((tag) => !contactTags.includes(tag))
  const removedTags= contactTags.filter((tag) => !newTags.includes(tag))
  if (addedTags.length > 0) {
    console.log("addedTags: ", addedTags)
    createContactEvent(ContactEventType.TAGGED, addedTags.join(","), by, contactId)
  }
  if (removedTags.length > 0) {
    console.log("removedTags: ", removedTags)
    createContactEvent(ContactEventType.UNTAGGED, removedTags.join(","), by, contactId)
  }
}

export async function addTagsToContact(contactId: string, tags: string[], by: string | undefined) {
  const contact= await getContactDAO(contactId)
  const contactTags= contact?.tags || []
  console.log("contactTags: ", contactTags)
  // add tags if not already in contact tags
  const newTags= tags.filter((tag) => !contactTags.includes(tag))
  console.log("newTags: ", newTags)
  const updated= await prisma.contact.update({
    where: { id: contactId },
    data: { tags: [...contactTags, ...newTags] }
  })
  if (!updated) throw new Error("Error al actualizar las etiquetas del contacto")

  newTags.forEach((tag) => {
    createContactEvent(ContactEventType.TAGGED, tag, by, contactId)
  })

  return updated
}

export async function getStageByContactId(contactId: string) {
  const contact= await prisma.contact.findUnique({
    where: { id: contactId },
    include: { stage: true }
  })
  if (!contact) throw new Error("Contact not found")

  return contact.stage.name
}

export async function getFilteredContacts(clientId: string, from: Date | null, to: Date | null, tags: string[], stageId: string | undefined): Promise<ContactDAOWithStage[]> {
  console.log("from: ", from)
  console.log("to: ", to)
  console.log("tags: ", tags)
  const found = await prisma.contact.findMany({
    where: {
      clientId,
      updatedAt: {
        gte: from || undefined,
        lte: to || undefined
      },
      tags: tags.length > 0 ? {
        hasSome: tags
      } : undefined,
      stageId: stageId
    },
    include: {
      stage: true,
    }
  })
  return found
}