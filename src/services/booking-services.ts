import { prisma } from "@/lib/db"
import { Booking, BookingStatus } from "@/lib/generated/prisma"
import { addMinutes, format, isAfter } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import * as z from "zod"
import { getClientBySlug } from "./clientService"
import { getEventDAO, updateSeatsAvailable } from "./event-services"
import { checkBookingAvailability } from "./slots-service"
import { createNotification, NotificationFormValues } from "./notification-services"
import { getOrCreateContact } from "./contact-services"
import { sendMessageToContact } from "./campaign-services"
import { es } from "date-fns/locale"

export type BookingDAO = {
	id: string
	eventName: string
	start: Date
	end: Date
	seats: number
	price: number | undefined | null
	status: BookingStatus
	name: string
	contact: string
	data: string | undefined | null
	createdAt: Date
	updatedAt: Date
	confirmationDate: Date | undefined | null
	eventId: string
	clientId: string
	conversationId: string | undefined | null
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
	data: z.string().optional(),
	eventId: z.string().min(1, "eventId is required."),
	clientId: z.string().min(1, "clientId is required."),
	conversationId: z.string().optional(),
})

export type BookingFormValues = z.infer<typeof bookingSchema>


export async function getBookingsDAO(eventId: string) {
  const found = await prisma.booking.findMany({
    where: {
      eventId
    },
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
  const end = data.end ? toZonedTime(data.end, event.timezone) : addMinutes(start, event.minDuration || 0)
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

  if (event.type === "FIXED_DATE") {
    await updateSeatsAvailable(event.id)  
  }

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
    },
    include: {
      event: true,
    }
  })

  const event= canceled.event
  if (event.type === "FIXED_DATE") {
    await updateSeatsAvailable(event.id)
  }

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
    orderBy: [
      {
        start: 'asc'
      },
      {
        createdAt: 'asc'
      }
    ],
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
    
export async function blockSlot(eventId: string, start: Date, end: Date, seats: number = 1) {
  const event= await getEventDAO(eventId)
  if (!event) throw new Error("Event not found")
  const isAvailable= await checkBookingAvailability(start, end, event, seats)
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
      seats: seats,      
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

export async function getConfirmationMessage(bookingId: string) {
  const booking= await prisma.booking.findUnique({
    where: {
      id: bookingId
    },
    include: {
      event: {
        select: {
          confirmationTemplate: true,
        }
      }
    }
  })
  if (!booking) throw new Error("Booking not found")

  if (!booking.event.confirmationTemplate) throw new Error("Este evento no tiene una plantilla de confirmación")

  let message= booking.event.confirmationTemplate.replace("{nombre}", booking.name)
  message= message?.replace("{fecha}", format(booking.start, "PPPP", { locale: es }))
  message= message?.replace("{hora}", format(booking.start, "HH:mm"))
  message= message?.replace("{fecha_y_hora}", format(booking.start, "dd/MM/yyyy HH:mm"))
  return message
}

export async function confirmBooking(bookingId: string, message: string) {
  const booking= await getBookingDAO(bookingId)
  if (!booking) throw new Error("Booking not found")

  // send whatsapp message vía Chatwoot
  const contact= await getOrCreateContact(booking.clientId, booking.contact, booking.name)
  if (contact) {
      console.log("contact found: ", contact.name + " " + contact.phone)
      await sendMessageToContact(booking.clientId, contact, message, [], null, "confirmBooking")
      console.log("message sent to contact: ", contact.name)
  } else {
      throw new Error("No se pudo crear o encontrar ni crear el contacto con teléfono: " + booking.contact)
  }

  const notificationValues: NotificationFormValues = {
    bookingId,
    message,
    type: "BOOKING_CONFIRMATION",
    clientId: booking.clientId,
    phone: booking.contact,
  }
  const notification= await createNotification(notificationValues)
  await prisma.booking.update({
    where: {
      id: bookingId
    },
    data: {
      confirmationDate: new Date()
    }
  })
  return notification
}


export async function getFutureBookingsDAOByPhone(phone: string, clientId: string) {
  const now= toZonedTime(new Date(), "America/Montevideo")
  console.log("now: ", now)
  const found = await prisma.booking.findMany({
    where: {
      clientId,
      contact: phone,
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
