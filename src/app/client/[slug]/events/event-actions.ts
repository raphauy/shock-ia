"use server"
  
import { revalidatePath } from "next/cache"
import { EventDAO, EventFormValues, createEvent, updateEvent, getFullEventDAO, deleteEvent, setAvailability } from "@/services/event-services"
import { getClientBySlug } from "@/services/clientService"


export async function getEventDAOAction(id: string): Promise<EventDAO | null> {
    return getFullEventDAO(id)
}

export async function createOrUpdateEventAction(clientSlug: string, id: string | null, data: EventFormValues): Promise<EventDAO | null> {       
    const client= await getClientBySlug(clientSlug)
    if (!client) throw new Error("Client not found")
    let updated= null
    if (id) {
        updated= await updateEvent(id, data)
    } else {
        updated= await createEvent(client.id, data)
    }     

    revalidatePath("/client/[slug]/events", 'page')

    return updated as EventDAO
}

export async function deleteEventAction(id: string): Promise<EventDAO | null> {    
    const deleted= await deleteEvent(id)

    revalidatePath("/client/[slug]/events", 'page')

    return deleted as EventDAO
}

export async function setAvailabilityAction(id: string, data: string[]): Promise<boolean> {    
    const updated= await setAvailability(id, data)

    revalidatePath("/client/[slug]/events", 'page')

    return updated
}