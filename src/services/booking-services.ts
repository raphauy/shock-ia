import { prisma } from "@/lib/db"
import { BookingStatus } from "@prisma/client"
import * as z from "zod"
import { getClientBySlug } from "./clientService"
import { EventDAO } from "./event-services"

export type BookingDAO = {
	id: string
	date: Date
	seats: number
	price: number | undefined
	status: BookingStatus
	name: string
	contact: string
	metadata: string | undefined
	createdAt: Date
	updatedAt: Date
	event: EventDAO
	eventId: string
	clientId: string
	conversationId: string | undefined
}

export const bookingSchema = z.object({
	date: z.date({required_error: "date is required."}),
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
  const seats = data.seats ? Number(data.seats) : 0
  const created = await prisma.booking.create({
    data: {
      ...data,
      status: "CONFIRMADO",
      seats: seats
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

export async function getFullBookingsDAOBySlug(slug: string) {
  const client= await getClientBySlug(slug)
  if (!client) throw new Error("Client not found")
  const found = await prisma.booking.findMany({
    where: {
      clientId: client.id
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
    