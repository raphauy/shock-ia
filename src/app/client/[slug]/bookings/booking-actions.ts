"use server"
  
import { revalidatePath } from "next/cache"
import { BookingDAO, BookingFormValues, createBooking, updateBooking, getFullBookingDAO, deleteBooking } from "@/services/booking-services"


export async function getBookingDAOAction(id: string): Promise<BookingDAO | null> {
    return getFullBookingDAO(id)
}

export async function createOrUpdateBookingAction(id: string | null, data: BookingFormValues): Promise<BookingDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateBooking(id, data)
    } else {
        updated= await createBooking(data)
    }     

    revalidatePath("/[slug]/bookings")

    return updated as BookingDAO
}

export async function deleteBookingAction(id: string): Promise<BookingDAO | null> {    
    const deleted= await deleteBooking(id)

    revalidatePath("/[slug]/bookings")

    return deleted as BookingDAO
}

