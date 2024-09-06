import { prisma } from "@/lib/db"
import { BookingStatus } from "@prisma/client"
import * as z from "zod"
import { getClientBySlug } from "./clientService"
import { EventDAO, getEventDAO } from "./event-services"
import { addMinutes } from "date-fns"

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
  const end = addMinutes(data.start, event.duration)
  const seats = data.seats ? Number(data.seats) : 0
  const created = await prisma.booking.create({
    data: {
      ...data,
      eventName: event.name,
      status: "RESERVADO",
      seats: seats,
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
    include: {
			event: true,
			client: true,
		}
  })
  return found as BookingDAO[]
}

export async function getFutureBookingsDAOByEventId(eventId: string) {
  const now= new Date()
  const found = await prisma.booking.findMany({
    where: {
      eventId,
      start: {
        gt: now
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
    include: {
      event: true,
      client: true,
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
    