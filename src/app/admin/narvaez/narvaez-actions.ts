"use server"
  
import { NarvaezDAO, NarvaezFormValues, createOrUpdateNarvaez, deleteNarvaez, getFullNarvaezDAO, updateNarvaez } from "@/services/narvaez-services"
import { revalidatePath } from "next/cache"


export async function getNarvaezDAOAction(id: string): Promise<NarvaezDAO | null> {
    return getFullNarvaezDAO(id)
}

export async function createOrUpdateNarvaezAction(id: string | null, data: NarvaezFormValues): Promise<NarvaezDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateNarvaez(id, data)
    } else {
        updated= await createOrUpdateNarvaez(data)
    }     

    revalidatePath("/admin/narvaezs")

    return updated as NarvaezDAO
}

export async function deleteNarvaezAction(id: string): Promise<NarvaezDAO | null> {    
    const deleted= await deleteNarvaez(id)

    revalidatePath("/admin/narvaezs")

    return deleted as NarvaezDAO
}

