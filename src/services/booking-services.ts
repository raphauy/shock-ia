import { prisma } from "@/lib/db"
import { Booking, BookingStatus } from "@prisma/client"
import { addMinutes, isAfter } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import * as z from "zod"
import { getClientBySlug } from "./clientService"
import { getEventDAO } from "./event-services"
import { checkBookingAvailability } from "./slots-service"

export type BookingDAO = {
	id: string
	eventName: string
	start: Date
	end: Date
	seats: number
	price: number | undefined
	status: BookingStatus
	name: string
	contact: string
	metadata: string | undefined
	createdAt: Date
	updatedAt: Date
	eventId: string
	clientId: string
	conversationId: string | undefined
}

export const bookingSchema = z.object({
	start: z.date({required_error: "start is required."}),
	end: z.date().optional(),
  seats: z.string()
    .refine((val) => !isNaN(Number(val)), { message: "debe ser un número" })
    .refine((val) => Number(val) > 0, { message: "debe haber al menos 1 cupo por experiencia" }),
	price: z.number().optional(),	
	name: z.string().min(1, "name is required."),
	contact: z.string().min(1, "contact is required."),
	metadata: z.string().optional(),
	eventId: z.string().min(1, "eventId is required."),
	clientId: z.string().min(1, "clientId is required."),
	conversationId: z.string().optional(),
})

export type BookingFormValues = z.infer<typeof bookingSchema>


export async function getBookingsDAO() {
  const found = await prisma.booking.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as BookingDAO[]
}

export async function getBookingDAO(id: string) {
  const found = await prisma.booking.findUnique({
    where: {
      id
    },
  })
  return found as BookingDAO
}
    
export async function createBooking(data: BookingFormValues) {
  const event = await getEventDAO(data.eventId)
  if (!event) throw new Error("Event not found")
  if (event.type === "MULTIPLE_SLOTS") {
    throw new Error("Eventos de duración variable aún no soportados")
  }
  const start= toZonedTime(data.start, event.timezone)
  const end = data.end ? toZonedTime(data.end, event.timezone) : addMinutes(start, event.minDuration)
  const seats = data.seats ? Number(data.seats) : 0
  const created = await prisma.booking.create({
    data: {
      ...data,
      eventName: event.name,
      status: "RESERVADO",
      seats: seats,
      start,
      end
    }
  })
  return created
}

export async function updateBooking(id: string, data: BookingFormValues) {
  const seats = data.seats ? Number(data.seats) : 0
  const updated = await prisma.booking.update({
    where: {
      id
    },
    data: {
      ...data,
      seats: seats
    }
  })
  return updated
}

export async function deleteBooking(id: string) {
  const deleted = await prisma.booking.delete({
    where: {
      id
    },
  })
  return deleted
}

export async function cancelBooking(id: string) {
  const canceled = await prisma.booking.update({
    where: {
      id
    },
    data: {
      status: "CANCELADO"
    }
  })
  return canceled
}

export async function getFullBookingsDAOBySlug(slug: string) {
  const client= await getClientBySlug(slug)
  if (!client) throw new Error("Client not found")
  const found = await prisma.booking.findMany({
    where: {
      clientId: client.id
    },
    orderBy: {
      createdAt: 'asc'
    },
  })
  return found as BookingDAO[]
}

export async function getFutureBookingsDAOByEventId(eventId: string, timezone: string) {
  const now= toZonedTime(new Date(), timezone)
  const found = await prisma.booking.findMany({
    where: {
      eventId,
      status: {
        not: "CANCELADO"
      },
      start: {
        gt: now
      }
    },
    orderBy: {
      start: 'asc'
    },
  })
  return found as BookingDAO[]
}
export async function getBookingsByState(eventId: string, state: BookingStatus) {
  const found = await prisma.booking.findMany({
    where: {
      eventId,
      status: state,
    },
    orderBy: {
      start: 'asc'
    },
    include: {
      event: true,
    }
  })
  return found as BookingDAO[]
}

export async function getFullBookingsDAO(eventId: string) {

  const found = await prisma.booking.findMany({
    where: {
      eventId
    },
    orderBy: {
      id: 'asc'
    },
    include: {
			event: true,
			client: true,
		}
  })
  return found as BookingDAO[]
}
  
export async function getFullBookingDAO(id: string) {
  const found = await prisma.booking.findUnique({
    where: {
      id
    },
    include: {
			event: true,
			client: true,
			conversation: true,
		}
  })
  return found as BookingDAO
}
    
export async function blockSlot(eventId: string, start: Date, end: Date) {
  const event= await getEventDAO(eventId)
  if (!event) throw new Error("Event not found")
  const isAvailable= checkBookingAvailability(start, end, event)
  if (!isAvailable) throw new Error("Slot not available")

  start= toZonedTime(start, event.timezone)
  end= toZonedTime(end, event.timezone)
  
  const blocked= await prisma.booking.create({
    data: {
      clientId: event.clientId,
      eventId,
      name: "Bloqueado",
      start,
      end,
      contact: "BLOQUEADO",
      eventName: event.name,
      seats: 0,      
      status: "BLOQUEADO"
    }
  })

  return blocked
}

export async function getFutureBookingsDAOByContact(contact: string, clientId: string) {
  const found = await prisma.booking.findMany({
    where: {
      clientId,
      contact,
      status: {
        not: "CANCELADO"
      },
    },
    orderBy: {
      start: 'asc'
    },
    include: {
      event: true,
    }
  })
  if (!found) return []

  const result: Booking[] = []
  // filter by future bookings, taking the timezone of the event for each booking
  for (const booking of found) {
    const now= toZonedTime(new Date(), booking.event.timezone)
    if (isAfter(booking.start, now)) {
      result.push(booking)
    }
  }
  return result
}