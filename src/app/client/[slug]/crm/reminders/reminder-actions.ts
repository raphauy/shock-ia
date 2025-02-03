"use server"
  
import { revalidatePath } from "next/cache"
import { ReminderDAO, ReminderFormValues, createReminder, updateReminder, getReminderDAO, deleteReminder, cancelReminder } from "@/services/reminder-services"


export async function getReminderDAOAction(id: string): Promise<ReminderDAO | null> {
    return getReminderDAO(id)
}

export async function createOrUpdateReminderAction(id: string | null, data: ReminderFormValues): Promise<ReminderDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateReminder(id, data)
    } else {
        updated= await createReminder(data)
    }     

    revalidatePath("/client/[slug]/crm", "page")

    return updated as ReminderDAO
}

export async function deleteReminderAction(id: string): Promise<ReminderDAO | null> {    
    const deleted= await deleteReminder(id)

    revalidatePath("/client/[slug]/crm", "page")

    return deleted as ReminderDAO
}

export async function cancelReminderAction(id: string): Promise<ReminderDAO | null> {
    const canceled= await cancelReminder(id)

    revalidatePath("/client/[slug]/crm", "page")

    return canceled as ReminderDAO
}

