import * as z from "zod"
import { prisma } from "@/lib/db"
import { Parameters, RepositoryDAO, generateFunctionDefinition, getFullRepositoryDAO, updateFunctionDefinition } from "./repository-services"
import { FieldType } from "@prisma/client"

export type FieldDAO = {
	id: string
	name: string
	type: FieldType
	description: string
	required: boolean
  order: number
	repositoryId: string
	createdAt: Date
	updatedAt: Date
}

export const fieldSchema = z.object({
	name: z.string().min(1, "name is required."),
	type: z.nativeEnum(FieldType),
	description: z.string().min(1, "description is required."),
	required: z.boolean().default(false),
	repositoryId: z.string().min(1, "repositoryId is required."),
})

export type FieldFormValues = z.infer<typeof fieldSchema>


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

  await updateFunctionDefinition(data.repositoryId)

  return created
}

export async function updateField(id: string, data: FieldFormValues) {
  const updated = await prisma.field.update({
    where: {
      id
    },
    data
  })

  await updateFunctionDefinition(data.repositoryId)

  return updated
}

export async function deleteField(id: string) {
  const deleted = await prisma.field.delete({
    where: {
      id
    },
  })

  await updateFunctionDefinition(deleted.repositoryId)

  return deleted
}


export async function getFullFieldsDAO() {
  const found = await prisma.field.findMany({
    orderBy: {
      id: 'asc'
    },
    include: {
			repository: true,
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
		}
  })
  return found as FieldDAO
}
    
export async function updateOrder(fields: FieldDAO[]): Promise<string> {
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

  await updateFunctionDefinition(fields[0].repositoryId)

  return fields[0].repositoryId
}