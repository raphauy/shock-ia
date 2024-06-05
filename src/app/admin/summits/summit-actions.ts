"use server"
  
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { SummitDAO, SummitFormValues, createSummit, updateSummit, getFullSummitDAO, deleteSummit, getSummitIdByConversationId } from "@/services/summit-services"


export async function getSummitDAOAction(id: string): Promise<SummitDAO | null> {
    return getFullSummitDAO(id)
}


export async function createOrUpdateSummitAction(id: string | null, data: SummitFormValues): Promise<SummitDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateSummit(id, data)
    } else {
        updated= await createSummit(data)
    }     

    revalidatePath("/admin/summits")

    return updated as SummitDAO
}

export async function deleteSummitAction(id: string): Promise<SummitDAO | null> {    
    const deleted= await deleteSummit(id)

    revalidatePath("/admin/summits")

    return deleted as SummitDAO
}

