"use server"
  
import { revalidatePath } from "next/cache"
import { FieldDAO, FieldFormValues, createField, updateField, getFullFieldDAO, deleteField, updateRepoFieldsOrder, updateEventFieldsOrder } from "@/services/field-services"


export async function getFieldDAOAction(id: string): Promise<FieldDAO | null> {
    return getFullFieldDAO(id)
}

export async function createOrUpdateFieldAction(id: string | null, data: FieldFormValues): Promise<FieldDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateField(id, data)
    } else {
        updated= await createField(data)
    }     

    revalidatePath(`/admin/repositories/${updated.repositoryId}`)

    return updated as FieldDAO
}

export async function deleteFieldAction(id: string): Promise<FieldDAO | null> {    
    const deleted= await deleteField(id)

    revalidatePath(`/admin/repositories/${deleted.repositoryId}`)
    revalidatePath("/client/[slug]/events", 'page')

    return deleted as FieldDAO
}

export async function updateRepoFieldOrderAction(fields: FieldDAO[]) {
    
    const repositoryId= await updateRepoFieldsOrder(fields)

    revalidatePath(`/admin/repositories/${repositoryId}`)    
}

export async function updateEventFieldOrderAction(fields: FieldDAO[]) {
    
    const eventId= await updateEventFieldsOrder(fields)

    revalidatePath(`/admin/events/${eventId}`)    
}
