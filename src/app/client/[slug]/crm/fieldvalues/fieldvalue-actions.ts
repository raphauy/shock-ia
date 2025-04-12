"use server"
  
import { revalidatePath } from "next/cache"
import { FieldValueDAO, FieldValueFormValues, createFieldValue, updateFieldValue, getFieldValueDAO, deleteFieldValue, getFieldValuesByContactId } from "@/services/fieldvalue-services"
import { ContactEventType } from "@/lib/generated/prisma"
import { createContactEvent } from "@/services/contact-event-services"
import { getCurrentUser } from "@/lib/auth"


export async function getFieldValueDAOAction(id: string): Promise<FieldValueDAO | null> {
    return getFieldValueDAO(id)
}

export async function createOrUpdateFieldValueAction(id: string | null, data: FieldValueFormValues): Promise<FieldValueDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateFieldValue(id, data)
    } else {
        updated= await createFieldValue(data)
    }     

    const currentUser= await getCurrentUser()
    if (updated && currentUser) {
        const byUser= currentUser?.name || currentUser?.email || undefined
        createContactEvent(ContactEventType.CUSTOM_FIELD_VALUE_UPDATED, updated.customField.name + ": " + updated.value, byUser, updated.contactId)
    }

    revalidatePath("/client/[slug]/crm", "page")

    return updated as FieldValueDAO
}

export async function deleteFieldValueAction(id: string): Promise<FieldValueDAO | null> {    
    const deleted= await deleteFieldValue(id)

    revalidatePath("/crm/fieldValues")

    return deleted as FieldValueDAO
}

export async function getFieldValuesByContactIdAction(contactId: string): Promise<FieldValueDAO[]> {
    return getFieldValuesByContactId(contactId)
}