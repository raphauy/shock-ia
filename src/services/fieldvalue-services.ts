import { prisma } from "@/lib/db"
import * as z from "zod"
import { CustomFieldDAO, getClientCustomFieldByName } from "./customfield-services"

export type FieldValueDAO = {
	id: string
	value: string
	contactId: string
	customField: CustomFieldDAO
	customFieldId: string
	createdAt: Date
	updatedAt: Date
}

export const FieldValueSchema = z.object({
	value: z.string().min(1, "value is required."),
	contactId: z.string().min(1, "contactId is required."),
	customFieldId: z.string().min(1, "customFieldId is required."),
})

export type FieldValueFormValues = z.infer<typeof FieldValueSchema>


export async function getFieldValuesDAO() {
  const found = await prisma.fieldValue.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as FieldValueDAO[]
}

export async function getFieldValueDAO(id: string) {
  const found = await prisma.fieldValue.findUnique({
    where: {
      id
    },
    include: {
      customField: true
    }
  })
  return found as FieldValueDAO
}


    
export async function createFieldValue(data: FieldValueFormValues) {
  const created = await prisma.fieldValue.create({
    data,
    include: {
      customField: true
    }
  })
  return created
}

export async function updateFieldValue(id: string, data: FieldValueFormValues) {
  const updated = await prisma.fieldValue.update({
    where: {
      id
    },
    data,
    include: {
      customField: true
    }
  })
  return updated
}

export async function deleteFieldValue(id: string) {
  const deleted = await prisma.fieldValue.delete({
    where: {
      id
    },
  })
  return deleted
}

export async function getFieldValuesByContactId(contactId: string) {
  const found = await prisma.fieldValue.findMany({
    where: {
      contactId
    },
    include: {
      customField: true
    }
  })
  return found as FieldValueDAO[]
}

export async function createOrUpdateFieldValue(data: FieldValueFormValues) {
  const found= await prisma.fieldValue.findFirst({
    where: {
      contactId: data.contactId,
      customFieldId: data.customFieldId
    }
  })
  let updated= null as FieldValueDAO | null
  if (found) {
    updated= await updateFieldValue(found.id, data)
  } else {
    updated= await createFieldValue(data)
  }
  return updated
}

export async function createOrUpdateFieldValues(objectWithFieldValues: any, clientId: string, contactId: string) {
  // Validar que objectWithFieldValues sea un objeto válido
  if (!objectWithFieldValues || typeof objectWithFieldValues !== 'object' || Array.isArray(objectWithFieldValues)) {
    throw new Error('customFields debe ser un objeto válido')
  }

  // iterar sobre la claves del objeto, buscar el customFieldId, crear o actualizar el fieldValue
  for (const key in objectWithFieldValues) {
    const customField= await getClientCustomFieldByName(clientId, key)
    if (customField) {
      const fieldValue= await createOrUpdateFieldValue({
        value: objectWithFieldValues[key],
        customFieldId: customField.id,
        contactId
      })
    }
  }
}