"use server"
  
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { SectionDAO, SectionFormValues, createSection, updateSection, deleteSection, getSectionDAO } from "@/services/section-services"


export async function getSectionDAOAction(id: string): Promise<SectionDAO | null> {
    return getSectionDAO(id)
}

export async function createOrUpdateSectionAction(id: string | null, data: SectionFormValues): Promise<SectionDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateSection(id, data)
    } else {
        updated= await createSection(data)
    }     

    revalidatePath("/sections")

    return updated as SectionDAO
}

export async function deleteSectionAction(id: string): Promise<SectionDAO | null> {    
    const deleted= await deleteSection(id)

    revalidatePath("/sections")

    return deleted as SectionDAO
}

