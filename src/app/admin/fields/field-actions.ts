"use server"
  
import { revalidatePath } from "next/cache"
import { FieldDAO, FieldFormValues, createField, updateField, getFullFieldDAO, deleteField, updateOrder } from "@/services/field-services"


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

    return deleted as FieldDAO
}

export async function updateOrderAction(notes: FieldDAO[]) {
    
    const repositoryId= await updateOrder(notes)

    revalidatePath(`/admin/repositories/${repositoryId}`)    
}

