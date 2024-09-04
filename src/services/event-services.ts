import * as z from "zod"
import { prisma } from "@/lib/db"
import { getClient } from "./clientService"
import { createEventType, createSchedule, EventType } from "./calcom-sdk-v2"

export type EventDAO = {
	id: string
	name: string
	slug: string
  color: string
	duration: number
	scheduleId: number
	eventTypeId: number
	description: string | undefined
	address: string | undefined
	seatsPerTimeSlot: number | undefined
	price: number | undefined
	isArchived: boolean
  availability: string[]
	createdAt: Date
	updatedAt: Date
	clientId: string
}

export const eventSchema = z.object({
	name: z.string().min(1, "name is required."),
	slug: z.string().min(1, "slug is required."),
	color: z.string({required_error: "color is required."}),
	description: z.string().optional(),
	address: z.string().optional(),

  duration: z.string()
    .refine((val) => !isNaN(Number(val)), { message: "debe ser un número" })
    .refine((val) => Number(val) > 15, { message: "la duración debe ser mayor que 15 minutos" }),
  seatsPerTimeSlot: z.string()
    .refine((val) => !isNaN(Number(val)), { message: "debe ser un número" })
    .refine((val) => Number(val) > 0, { message: "debe haber al menos 1 cupo" }),
  price: z.string()
    .refine((val) => !isNaN(Number(val)), { message: "debe ser un número" })
    .optional(),

  isArchived: z.boolean().default(false),
})

export type EventFormValues = z.infer<typeof eventSchema>


export async function getEventsDAO() {
  const found = await prisma.event.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as EventDAO[]
}

export async function getEventDAO(id: string) {
  const found = await prisma.event.findUnique({
    where: {
      id
    },
  })
  return found as EventDAO
}
    
export async function createEvent(clientId: string, data: EventFormValues) {
  const price= data.price ? Number(data.price) : 0
  const duration= data.duration ? Number(data.duration) : 0
  const seatsPerTimeSlot= data.seatsPerTimeSlot ? Number(data.seatsPerTimeSlot) : 0

  const client= await getClient(clientId)
  if (!client) throw new Error("Client not found")

  const scheduleName = client.name + " - " + data.name
  const timeZone = 'America/Montevideo';
  let scheduleId = 0
  let eventTypeId = 0
  try {
    scheduleId = await createSchedule(scheduleName, timeZone)
    const name= client.name + " - " + data.name
    const slug= client.slug + "-" + data.slug
    eventTypeId = await createCalComEvent(name, slug, data.description, data.address, seatsPerTimeSlot, scheduleId, duration, price)
      
  } catch (error) {
    console.error('Error creating event', error)
    throw new Error('Error al crear el evento en cal.com')
  }

  const created = await prisma.event.create({
    data: {
      ...data,
      clientId,
      scheduleId,
      eventTypeId,
      price,
      duration,
      seatsPerTimeSlot
    }
  })
  return created
}

export async function createCalComEvent(title: string,slug: string, description: string | undefined, address: string | undefined, seatsPerTimeSlot: number, scheduleId: number, duration: number, price: number) {
  const shockId = 949121;
  const host= {
      userId: shockId,
      isFixed: true,
  }
  const teamId= 17484    
  const newEvent: EventType = {
      teamId,
      length: duration,
      title,
      slug,
      scheduleId: scheduleId,
      minimumBookingNotice: 0,
      price,
      currency: 'UYU',
      slotInterval: duration,
      // successRedirectUrl,
      description,
      locations: [
          {
              address,
              type: 'inPerson',
              displayLocationPublicly: true,
          }
      ],
      seatsShowAttendees: false,
      seatsShowAvailabilityCount: true,
      schedulingType: 'ROUND_ROBIN',
      hosts: [host]
  }

  if (seatsPerTimeSlot > 1) {
    newEvent.seatsPerTimeSlot = seatsPerTimeSlot
  }

  const calComId = await createEventType(newEvent)

  return calComId
}

export async function updateEvent(id: string, data: EventFormValues) {
  const price= data.price ? Number(data.price) : 0
  const duration= data.duration ? Number(data.duration) : 0
  const seatsPerTimeSlot= data.seatsPerTimeSlot ? Number(data.seatsPerTimeSlot) : 0

  const updated = await prisma.event.update({
    where: {
      id
    },
    data: {
      ...data,
      price,
      duration,
      seatsPerTimeSlot
    }
  })
  return updated
}

export async function setScheduleId(id: string, scheduleId: number) {
  await prisma.event.update({
    where: {
      id
    },
    data: {
      scheduleId
    }
  })
}

export async function setEventTypeId(id: string, eventTypeId: number) {
  await prisma.event.update({
    where: {
      id
    },
    data: {
      eventTypeId
    }
  })
}

export async function deleteEvent(id: string) {
  const deleted = await prisma.event.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullEventsDAO(slug: string) {
  const found = await prisma.event.findMany({
    where: {
      client: {
        slug
      }
    },
    orderBy: {
      id: 'asc'
    },
    include: {
			client: true,
		}
  })
  return found as EventDAO[]
}
  
export async function getFullEventDAO(id: string) {
  const found = await prisma.event.findUnique({
    where: {
      id
    },
    include: {
			client: true,
		}
  })
  return found as EventDAO
}
    
export async function getAvailability(id: string) {
  const found = await prisma.event.findUnique({
    where: {
      id
    },
  })
  return found?.availability
}

export async function setAvailability(id: string, availability: string[]): Promise<boolean> {
  const updated= await prisma.event.update({
    where: {
      id
    },
    data: {
      availability
    }
  })
  return updated !== null  
}