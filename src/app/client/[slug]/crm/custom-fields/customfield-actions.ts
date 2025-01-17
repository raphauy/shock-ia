"use server"
  
import { revalidatePath } from "next/cache"
import { CustomFieldDAO, CustomFieldFormValues, createCustomField, updateCustomField, getCustomFieldDAO, deleteCustomField, updateCustomFieldsOrder, getClientCustomFields } from "@/services/customfield-services"


export async function getCustomFieldDAOAction(id: string): Promise<CustomFieldDAO | null> {
    return getCustomFieldDAO(id)
}

export async function createOrUpdateCustomFieldAction(id: string | null, data: CustomFieldFormValues): Promise<CustomFieldDAO | null> {
    // chequear y modificar el campo name con un trim()
    data.name= data.name.trim()
    let updated= null
    if (id) {
        updated= await updateCustomField(id, data)
    } else {
        updated= await createCustomField(data)
    }     

    revalidatePath("/client/[slug]/crm", "page")

    return updated as CustomFieldDAO
}

export async function deleteCustomFieldAction(id: string): Promise<CustomFieldDAO | null> {
    const deleted= await deleteCustomField(id)

    revalidatePath("/client/[slug]/crm", "page")

    return deleted as CustomFieldDAO
}

export async function updateCustomFieldsOrderAction(fields: CustomFieldDAO[]) {
    const clientId= await updateCustomFieldsOrder(fields)

    revalidatePath("/client/[slug]/crm", "page")
}

export async function getClientCustomFieldsAction(clientId: string): Promise<CustomFieldDAO[]> {
    return getClientCustomFields(clientId)
}