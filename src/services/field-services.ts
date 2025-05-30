import * as z from "zod"
import { prisma } from "@/lib/db"
import { Parameters, RepositoryDAO, generateFunctionDefinition, getFullRepositoryDAO, updateFunctionDefinition, updateRepositoryToolDefinition } from "./repository-services"
import { FieldType } from "@/lib/generated/prisma"
import { updateEventMetadata } from "./event-services"
import { JsonValue } from "@prisma/client/runtime/library"

export type FieldDAO = {
	id: string
	name: string
	type: FieldType
	description: string
	required: boolean
  order: number
  etiquetar: boolean
  listOptions: string[]
	repositoryId: string | null | undefined
  eventId: string | null | undefined
  linkedCustomFieldId: string | null | undefined
	createdAt: Date
	updatedAt: Date
}

export const repoFieldSchema = z.object({
	name: z.string().min(1, "name is required."),
	type: z.nativeEnum(FieldType),
	description: z.string().min(1, "description is required."),
	required: z.boolean().default(false),
  etiquetar: z.boolean().default(false),
  listOptions: z.array(z.string()).default([]),
	repositoryId: z.string().optional(),
  eventId: z.string().optional(),
  linkedCustomFieldId: z.string().optional(),
})

export type FieldFormValues = z.infer<typeof repoFieldSchema>

export async function getFieldsDAO() {
  const found = await prisma.field.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as FieldDAO[]
}

export async function getFieldDAO(id: string) {
  const found = await prisma.field.findUnique({
    where: {
      id
    },
  })
  return found as FieldDAO
}
    
export async function createField(data: FieldFormValues) {
  const lastOrder= await prisma.field.count()
  const created = await prisma.field.create({
    data: {
      ...data,
      order: lastOrder + 1
    }
  })

  if (data.repositoryId) {
    await updateFunctionDefinition(data.repositoryId)
    await updateRepositoryToolDefinition(data.repositoryId)
  }

  if (data.eventId) {
    await updateEventMetadata(data.eventId)
  }

  return created
}

export async function updateField(id: string, data: FieldFormValues) {
  const updated = await prisma.field.update({
    where: {
      id
    },
    data
  })

  if (data.repositoryId) {
    await updateFunctionDefinition(data.repositoryId)
    await updateRepositoryToolDefinition(data.repositoryId)
  }

  if (data.eventId) {
    await updateEventMetadata(data.eventId)
  }

  return updated
}

export async function deleteField(id: string) {
  const deleted = await prisma.field.delete({
    where: {
      id
    },
  })

  if (deleted.repositoryId) {
    await updateFunctionDefinition(deleted.repositoryId)
    await updateRepositoryToolDefinition(deleted.repositoryId)
  }

  if (deleted.eventId) {
    await updateEventMetadata(deleted.eventId)
  }

  return deleted
}


export async function getFullFieldsDAO() {
  const found = await prisma.field.findMany({
    orderBy: {
      id: 'asc'
    },
    include: {
			repository: true,
      event: true
		}
  })
  return found as FieldDAO[]
}
  
export async function getFullFieldDAO(id: string) {
  const found = await prisma.field.findUnique({
    where: {
      id
    },
    include: {
			repository: true,
      event: true
		}
  })
  return found as FieldDAO
}
    
export async function updateRepoFieldsOrder(fields: FieldDAO[]): Promise<string> {
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    await prisma.field.update({
      where: {
        id: field.id,
      },
      data: {
        order: i,
      },
    })
  }

  if (fields[0].repositoryId) {
    await updateFunctionDefinition(fields[0].repositoryId)
    await updateRepositoryToolDefinition(fields[0].repositoryId)
    return fields[0].repositoryId
  } else {
    throw new Error("Repository ID is required")
  }  
}

export async function updateEventFieldsOrder(fields: FieldDAO[]): Promise<string> {
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    await prisma.field.update({
      where: {
        id: field.id,
      },
      data: {
        order: i,
      },
    })
  }

  if (fields[0].eventId) {
    await updateEventMetadata(fields[0].eventId)
    return fields[0].eventId
  } else {
    throw new Error("Event ID is required")
  }  

}

export async function getFieldsDAOByRepositoryId(repositoryId: string) {
  const found = await prisma.field.findMany({
    where: {
      repositoryId
    },
    orderBy: {
      order: "asc"
    },
  })
  return found as FieldDAO[]
}

export async function getFieldsDAOByEventId(eventId: string) {
  const found = await prisma.field.findMany({
    where: {
      eventId
    },
    orderBy: {
      order: "asc"
    },
  })
  return found as FieldDAO[]
}

export async function getDataTags(repositoryId: string, data: string | JsonValue) {
  const fields = await prisma.field.findMany({
    where: {
      repositoryId
    }
  })

  return getTagsFromData(fields, data)
}

export async function getEventDataTags(eventId: string, data: string | JsonValue) {
  const fields = await prisma.field.findMany({
    where: {
      eventId
    }
  })

  return getTagsFromData(fields, data)
}

function getTagsFromData(fields: FieldDAO[], data: string | JsonValue) {
  const tags: string[] = []
  const jsonData = typeof data === 'string' ? JSON.parse(data) : data
  for (const field of fields) {
    if (field.etiquetar && jsonData[field.name]) {
      if (field.type === "list") {
        const values = Array.isArray(jsonData[field.name]) 
          ? jsonData[field.name] 
          : jsonData[field.name].split(",")
        tags.push(...values)
      } else {
        tags.push(jsonData[field.name])
      }
    }
  }
  return tags
}
