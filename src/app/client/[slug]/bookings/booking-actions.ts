"use server"
  
import { revalidatePath } from "next/cache"
import { BookingDAO, BookingFormValues, createBooking, updateBooking, getFullBookingDAO, deleteBooking, cancelBooking, blockSlot, getConfirmationMessage, confirmBooking } from "@/services/booking-services"


export async function getBookingDAOAction(id: string): Promise<BookingDAO | null> {
    return getFullBookingDAO(id)
}

export async function createOrUpdateBookingAction(id: string | null, data: BookingFormValues): Promise<BookingDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateBooking(id, data)
    } else {
        updated= await createBooking(data)
        console.log("booking created: ", updated)
    }     

    revalidatePath("/client/[slug]/events", "page")

    return updated as BookingDAO
}

export async function createBookingAction(data: BookingFormValues): Promise<BookingDAO | null> {
    const created= await createBooking(data)
    revalidatePath("/client/[slug]/events", "page")
    return created as BookingDAO
}

export async function deleteBookingAction(id: string): Promise<BookingDAO | null> {    
    const deleted= await deleteBooking(id)

    revalidatePath("/client/[slug]/events", "page")

    return deleted as BookingDAO
}

export async function cancelBookingAction(id: string): Promise<BookingDAO | null> {    
    const canceled= await cancelBooking(id)

    revalidatePath("/client/[slug]/events", "page")

    return canceled as BookingDAO
}

export async function blockSlotAction(eventId: string, start: Date, end: Date, seats: number = 1): Promise<boolean> {    
    const blocked= await blockSlot(eventId, start, end, seats)
    if (!blocked) return false

    revalidatePath("/client/[slug]/events", "page")

    return true
}

export async function ConfirmBookingAction(bookingId: string, message: string): Promise<boolean> {
    const confirmed= await confirmBooking(bookingId, message)
    if (!confirmed) return false

    revalidatePath("/client/[slug]/events", "page")

    return true
}


export async function getConfirmationMessageAction(bookingId: string): Promise<string> {
    const message= await getConfirmationMessage(bookingId)
    if (!message) throw new Error("El mensaje de confirmación no se pudo generar")
    return message
}