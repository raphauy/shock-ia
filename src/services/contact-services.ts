import { prisma } from "@/lib/db"
import { ContactEventType } from "@prisma/client"
import * as z from "zod"
import { deleteContactInChatwoot } from "./chatwoot"
import { getChatwootAccountId } from "./clientService"
import { createContactEvent } from "./contact-event-services"
import { getImportedContactByChatwootId } from "./imported-contacts-services"
import { createDefaultStages, getFirstStageOfClient, getStageByName, StageDAO } from "./stage-services"
import { removeContactFromAllConversations } from "./conversationService"
import { ApiError } from "@figuro/chatwoot-sdk"

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
  let tags: string[]= []
  const importedContact= await getImportedContactByChatwootId(data.chatwootId || "")
  if (importedContact) {
    const stageName= importedContact.stageName
    const stage= await getStageByName(data.clientId, stageName || "")
    if (stage) {
      firstStage= stage
    }
    tags= importedContact.tags || []
  }
  
  if (!firstStage){
    console.log('No first stage found, creating default stages')
    await createDefaultStages(data.clientId)
    firstStage= await getFirstStageOfClient(data.clientId)
  }

  if (!firstStage) throw new Error('No se encontró el stage inicial. Verifica que existan stages para este cliente')    

  // Verificar que el stage pertenezca al cliente correcto
  const stageExists = await prisma.stage.findFirst({
    where: {
      id: firstStage.id,
      clientId: data.clientId
    }
  })
  
  if (!stageExists) throw new Error('El stage no existe')

  const minOrder = await getMinOrderOfStage(firstStage.id)

  const created = await prisma.contact.create({
    data: {
      ...data,
      stageId: firstStage.id,
      order: minOrder - 1,
      tags
    },
    include: {
			stage: true,
		},
  })
  if (!created) throw new Error('Error creating contact')
  await createContactEvent(ContactEventType.CREATED, undefined, undefined, created.id)

  if (importedContact) {
    const stageName= importedContact.stageName
    const stage= await getStageByName(data.clientId, stageName || "")
    if (stage) {
      await createContactEvent(ContactEventType.MOVED_TO_STAGE, stage.name, "Import-"+importedContact.type, created.id)
    }
    if (tags.length > 0) {
      for (const tag of tags) {
        await createContactEvent(ContactEventType.TAGGED, tag, "Import-"+importedContact.type, created.id)
      }
    }
  }

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
  const contact = await getContactDAO(id)
  if (!contact) throw new Error("Contact not found")

  const chatwootAccountId = await getChatwootAccountId(contact.clientId)
  if (!chatwootAccountId) throw new Error("Chatwoot account not found")

  const chatwootContactId= contact.chatwootId
  if (chatwootContactId && !isNaN(Number(chatwootContactId))) {
    console.log("deleting contact in chatwoot: ", chatwootContactId)
    // catch  Internal error: ApiError: Contact not found
    try {
      await deleteContactInChatwoot(Number(chatwootAccountId), Number(chatwootContactId))
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        console.log("Contact not found in chatwoot, skipping deletion")
      } else {
        console.error("Error deleting contact in chatwoot: ", error)
        throw error
      }
    }
  }

  await removeContactFromAllConversations(contact.id, contact.clientId)

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
    // Verificar que todos los stages existan y pertenezcan al cliente correcto
    for (const contact of contacts) {
      const stage = await prisma.stage.findFirst({
        where: {
          id: contact.stageId,
          clientId: contact.clientId
        }
      })
      
      if (!stage) {
        throw new Error(`El stage ${contact.stageId} no existe o no pertenece al cliente del contacto ${contact.id}`)
      }
    }

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
  // Verificar que el contacto y stage existan y pertenezcan al mismo cliente
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { client: true }
  })
  
  if (!contact) throw new Error("Contacto no encontrado")

  const stage = await prisma.stage.findFirst({
    where: {
      id: stageId,
      clientId: contact.clientId
    }
  })

  if (!stage) throw new Error("El stage no existe o no pertenece al cliente del contacto")

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
    },
    orderBy: {
      id: "desc"
    }
  })
  return found
}