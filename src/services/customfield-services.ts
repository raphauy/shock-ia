import * as z from "zod"
import { prisma } from "@/lib/db"
import { FieldType } from "@/lib/generated/prisma"

export type CustomFieldDAO = {
	id: string
	name: string
	description: string | null | undefined
	type: FieldType
	order: number
  showInContext: boolean
	clientId: string
	createdAt: Date
	updatedAt: Date
}

export const CustomFieldSchema = z.object({
	name: z.string().min(1, "name is required."),
	description: z.string().optional(),
  showInContext: z.boolean(),
	type: z.nativeEnum(FieldType),
	clientId: z.string().min(1, "clientId is required."),
})

export type CustomFieldFormValues = z.infer<typeof CustomFieldSchema>


export async function getCustomFieldsDAO() {
  const found = await prisma.customField.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as CustomFieldDAO[]
}

export async function getCustomFieldDAO(id: string) {
  const found = await prisma.customField.findUnique({
    where: {
      id
    },
  })
  return found as CustomFieldDAO
}


    
export async function createCustomField(data: CustomFieldFormValues) {
  const maxOrder = await prisma.customField.findFirst({
    where: {
      clientId: data.clientId
    },
    orderBy: {
      order: 'desc'
    }
  })
  const created = await prisma.customField.create({
    data: {
      ...data,
      order: maxOrder ? maxOrder.order + 1 : 0
    }
  })
  return created
}

export async function updateCustomField(id: string, data: CustomFieldFormValues) {
  const updated = await prisma.customField.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteCustomField(id: string) {
  const deleted = await prisma.customField.delete({
    where: {
      id
    },
  })
  return deleted
}

export async function updateCustomFieldsOrder(fields: CustomFieldDAO[]): Promise<string> {
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    await prisma.customField.update({
      where: {
        id: field.id,
      },
      data: {
        order: i,
      },
    })
  }

  if (fields[0].clientId) {
    return fields[0].clientId
  } else {
    throw new Error("Client ID is required")
  }  
}

export async function getClientCustomFields(clientId: string) {
  const fields = await prisma.customField.findMany({
    where: {
      clientId
    },
    orderBy: {
      order: 'asc'
    }
  })
  return fields as CustomFieldDAO[]
}

export async function getClientCustomFieldByName(clientId: string, name: string) {
  const field = await prisma.customField.findFirst({
    where: {
      clientId,
      name
    }
  })
  return field
}