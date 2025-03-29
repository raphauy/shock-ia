"use server"
  
import { revalidatePath } from "next/cache"
import { ReminderDefinitionDAO, ReminderDefinitionFormValues, createReminderDefinition, updateReminderDefinition, getReminderDefinitionDAO, deleteReminderDefinition } from "@/services/reminder-definition-services"


export async function getReminderDefinitionDAOAction(id: string): Promise<ReminderDefinitionDAO | null> {
    return getReminderDefinitionDAO(id)
}

export async function createOrUpdateReminderDefinitionAction(id: string | null, data: ReminderDefinitionFormValues, clientId: string): Promise<ReminderDefinitionDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateReminderDefinition(id, data)
    } else {
        updated= await createReminderDefinition(data, clientId)
    }     

    revalidatePath("/client/[slug]/crm/reminder-definitions", "page")
    revalidatePath("/client/[slug]/productos/config", "page")

    return updated as ReminderDefinitionDAO
}

export async function deleteReminderDefinitionAction(id: string): Promise<ReminderDefinitionDAO | null> {    
    const deleted= await deleteReminderDefinition(id)

    revalidatePath("/client/[slug]/crm/reminder-definitions", "page")
    revalidatePath("/client/[slug]/productos/config", "page")

    return deleted as ReminderDefinitionDAO
}

