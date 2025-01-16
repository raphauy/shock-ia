"use server"
  
import { checkValidPhone } from "@/lib/utils"
import { getClientBySlug } from "@/services/clientService"
import { EventDAO, createEvent, deleteEvent, getFullEventDAO, setAvailability, setEventDateTime, updateEventBooleanField, updateEventField, updateEventNumberField, setSeatsPerTimeSlot, setTagsOfEvent, setMoveToStageIdEvent, setEventNotifyPhones } from "@/services/event-services"
import { EventType } from "@prisma/client"
import { revalidatePath } from "next/cache"


export async function getEventDAOAction(id: string): Promise<EventDAO | null> {
    return getFullEventDAO(id)
}

export async function createEventAction(clientSlug: string, name: string, type: EventType): Promise<EventDAO | null> {    
    const client= await getClientBySlug(clientSlug)
    if (!client) throw new Error("Client not found")
    const created= await createEvent(client.id, name, type)

    revalidatePath("/client/[slug]/events", 'page')

    return created as EventDAO
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

export async function setEventDateTimeAction(id: string, startDateTime: Date, endDateTime: Date): Promise<boolean> {    
    const ok= await setEventDateTime(id, startDateTime, endDateTime)

    revalidatePath("/client/[slug]/events", 'page')

    return ok
}

export async function updateseatsPerTimeSlotAction(id: string, notUsed: string, seatsPerTimeSlot: number): Promise<boolean> {    
    const ok= await setSeatsPerTimeSlot(id, seatsPerTimeSlot)

    revalidatePath("/client/[slug]/events", 'page')

    return ok
}

export async function setTagsOfEventAction(id: string, tags: string[]): Promise<boolean> {    
    const ok= await setTagsOfEvent(id, tags)

    revalidatePath("/client/[slug]/events", 'page')

    return true
}

export async function setMoveToStageIdEventAction(eventId: string, moveToStageId: string): Promise<boolean> {
    const updated= await setMoveToStageIdEvent(eventId, moveToStageId)

    if (!updated) return false

    revalidatePath(`/client/[slug]/events`, 'page')

    return true
}

export async function setEventNotifyPhonesAction(id: string, notifyPhones: string): Promise<boolean> {
    const notifyPhonesArray= notifyPhones.split(",").map(phone => phone.trim())
    // if a phone do not have a +, add it
    for (let i = 0; i < notifyPhonesArray.length; i++) {
        if (!notifyPhonesArray[i].startsWith("+")) {
            notifyPhonesArray[i]= "+" + notifyPhonesArray[i]
        }
    }
    // check if all phones are valid
    for (const phone of notifyPhonesArray) {
        console.log("checking phone: ", phone)
        if (!checkValidPhone(phone))
            throw new Error("Teléfono inválido: " + phone)
    }
    const updated= await setEventNotifyPhones(id, notifyPhonesArray)

    if (!updated) return false

    revalidatePath("/client/[slug]/events", 'page')

    return true
}