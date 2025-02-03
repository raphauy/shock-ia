"use server"
  
import { revalidatePath } from "next/cache"
import { ReminderDefinitionDAO, ReminderDefinitionFormValues, createReminderDefinition, updateReminderDefinition, getReminderDefinitionDAO, deleteReminderDefinition } from "@/services/reminder-definition-services"


export async function getReminderDefinitionDAOAction(id: string): Promise<ReminderDefinitionDAO | null> {
    return getReminderDefinitionDAO(id)
}

export async function createOrUpdateReminderDefinitionAction(id: string | null, data: ReminderDefinitionFormValues): Promise<ReminderDefinitionDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateReminderDefinition(id, data)
    } else {
        updated= await createReminderDefinition(data)
    }     

    revalidatePath("/client/[slug]/crm", "page")

    return updated as ReminderDefinitionDAO
}

export async function deleteReminderDefinitionAction(id: string): Promise<ReminderDefinitionDAO | null> {    
    const deleted= await deleteReminderDefinition(id)

    revalidatePath("/client/[slug]/crm", "page")

    return deleted as ReminderDefinitionDAO
}

