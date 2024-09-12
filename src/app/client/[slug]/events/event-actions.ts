"use server"
  
import { revalidatePath } from "next/cache"
import { EventDAO, EventFormValues, createEvent, updateEvent, getFullEventDAO, deleteEvent, setAvailability, updateEventField, updateEventNumberField, updateEventBooleanField } from "@/services/event-services"
import { getClientBySlug } from "@/services/clientService"


export async function getEventDAOAction(id: string): Promise<EventDAO | null> {
    return getFullEventDAO(id)
}

export async function createEventAction(clientSlug: string, name: string): Promise<EventDAO | null> {    
    const client= await getClientBySlug(clientSlug)
    if (!client) throw new Error("Client not found")
    const created= await createEvent(client.id, name)

    revalidatePath("/client/[slug]/events", 'page')

    return created as EventDAO
}

export async function updateEventAction(id: string, data: EventFormValues): Promise<EventDAO | null> {    
    const updated= await updateEvent(id, data)

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

export async function setEventFieldAction(id: string, name: string, value: string): Promise<boolean> {    
    const ok= await updateEventField(id, name, value)

    revalidatePath("/client/[slug]/events", 'page')

    return ok
}

export async function seEventNumberFieldAction(id: string, name: string, value: number): Promise<boolean> {
    let ok= false
    if (name === "duration") {
        ok= await updateEventNumberField(id, "minDuration", value)
        if (!ok) return false
        ok= await updateEventNumberField(id, "maxDuration", value)
    } else {
        ok= await updateEventNumberField(id, name, value)
    }

    revalidatePath("/client/[slug]/events", 'page')

    return ok
}

export async function setEventBooleanFieldAction(id: string, name: string, value: boolean): Promise<boolean> {    
    const ok= await updateEventBooleanField(id, name, value)

    revalidatePath("/client/[slug]/events", 'page')

    return ok
}