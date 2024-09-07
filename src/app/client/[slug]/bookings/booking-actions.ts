"use server"
  
import { revalidatePath } from "next/cache"
import { BookingDAO, BookingFormValues, createBooking, updateBooking, getFullBookingDAO, deleteBooking, cancelBooking } from "@/services/booking-services"


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

    revalidatePath("/[slug]/bookings", "page")

    return updated as BookingDAO
}

export async function createBookingAction(data: BookingFormValues): Promise<BookingDAO | null> {
    const created= await createBooking(data)
    revalidatePath("/[slug]/bookings", "page")
    return created as BookingDAO
}

export async function deleteBookingAction(id: string): Promise<BookingDAO | null> {    
    const deleted= await deleteBooking(id)

    revalidatePath("/[slug]/bookings", "page")

    return deleted as BookingDAO
}

export async function cancelBookingAction(id: string): Promise<BookingDAO | null> {    
    const canceled= await cancelBooking(id)

    revalidatePath("/[slug]/bookings", "page")

    return canceled as BookingDAO
}

