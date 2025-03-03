import { prisma } from "@/lib/db"
import { generateSlug } from "@/lib/utils"
import { EventType, FieldType } from "@prisma/client"
import * as z from "zod"
import { getClient } from "./clientService"
import { getBookingsDAO } from "./booking-services"
import { createField, FieldDAO } from "./field-services"
import { ReminderDefinitionDAO } from "./reminder-definition-services"

export type EventWithReminderDefinitions = EventDAO & {
  reminderDefinitions: ReminderDefinitionDAO[],
  clientHaveCRM: boolean
}

export type EventDAO = {
	id: string
	name: string
	slug: string
  color: string
  tags: string[]
  webHookUrl: string | null | undefined
  notifyPhones: string[] | undefined
	minDuration: number | undefined
	maxDuration: number | undefined
	description: string | undefined
	address: string | undefined
	seatsPerTimeSlot: number | undefined
  seatsAvailable: number | undefined
	price: number | undefined
	isArchived: boolean
  confirmationTemplate: string | undefined
  moveToStageId: string | undefined
  availability: string[]
  timezone: string
  type: EventType
  startDateTime: Date | undefined
  endDateTime: Date | undefined
	createdAt: Date
	updatedAt: Date
	clientId: string
  metadata: string | null | undefined
  askInSequence: boolean
  fields: FieldDAO[]
}

export const nameSchema = z.object({
	name: z.string().min(1, "name is required."),
})

export type NameFormValues = z.infer<typeof nameSchema>

export async function getActiveEventsDAOByClientId(clientId: string, type: EventType) {
  const found = await prisma.event.findMany({
    where: {
      clientId,
      isArchived: false,
      type,
      OR: [
        { startDateTime: null },
        { startDateTime: { gte: new Date() } }
      ]
    },
    orderBy: {
      createdAt: 'asc'
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
    
export async function createEvent(clientId: string, name: string, type: EventType) {
  const client= await getClient(clientId)
  if (!client) throw new Error("Client not found")

  const slug= generateSlug(name)
  const slugAvailable= await checkSlugAvailability(clientId, slug)
  if (!slugAvailable) throw new Error("El slug generado para este nombre ya existe")

  const created = await prisma.event.create({
    data: {
      clientId,
      type,
      name,
      slug,
      color: "#bfe1ff",
      minDuration: 60,
      maxDuration: 60,
      description: "Modifica esta descripción",
      address: "Modifica esta dirección",
      seatsPerTimeSlot: 1,
      seatsAvailable: 1,
      price: 0,
      isArchived: false,
      availability: [],
    }
  })
  // create the first field
  const fieldName= "nombre"
  const fieldType= FieldType.string
  const fieldDescription= "Nombre para la reserva."
  const fieldRequired= true
  await createField({
    name: fieldName,
    type: fieldType,
    description: fieldDescription,
    required: fieldRequired,
    etiquetar: false,
    listOptions: [],
    eventId: created.id
  })
  const updated= await updateEventMetadata(created.id)
  return created
}

async function checkSlugAvailability(clientId: string, slug: string) {
  const found = await prisma.event.findFirst({  
    where: {
      slug,
      clientId
    },
  })
  return found === null
}


export async function updateEventField(id: string, field: string, value: string) {
  // if field is name, generate slug, check slug availability and update both
  if (field === "name") {
    const slug= generateSlug(value)
    const event= await getEventDAO(id)
    if (!event) throw new Error("Event not found")
    const slugAvailable= await checkSlugAvailability(event.clientId, slug)
    console.log(event.slug)
    console.log(slug)
    console.log(slugAvailable)
    if (!slugAvailable) throw new Error("El nombre ya está ocupado")
    await updateEventField(id, "slug", slug)
  } 
  const updated= await prisma.event.update({
    where: {
      id
    },
    data: {
      [field]: value
    }
  })

  return updated !== null
}

export async function updateEventNumberField(id: string, field: string, value: number) {
  const updated= await prisma.event.update({
    where: {
      id
    },
    data: {
      [field]: value
    }
  })
  return updated !== null
}

export async function updateEventBooleanField(id: string, field: string, value: boolean) {
  const updated= await prisma.event.update({
    where: {
      id
    },
    data: {
      [field]: value
    }
  })
  return updated !== null
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
      fields: true,
      reminderDefinitions: true
		}
  })
  return found as EventDAO[]
}
  
export async function getFullEventDAO(id: string): Promise<EventWithReminderDefinitions> {
  const found = await prisma.event.findUnique({
    where: {
      id
    },
    include: {
			client: true,
      fields: {
        orderBy: {
          order: "asc"
        }
      },
      reminderDefinitions: {
        include: {
          reminderDefinition: true
        }
      }
		}
  })

  if (!found) throw new Error("Event not found")

  // Transform the data to match EventWithReminderDefinitions type
  return {
    ...found,
    clientHaveCRM: found.client.haveCRM,
    reminderDefinitions: found.reminderDefinitions.map(rd => rd.reminderDefinition)
  } as EventWithReminderDefinitions
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

export async function setEventDateTime(id: string, startDateTime: Date, endDateTime: Date): Promise<boolean> {
  const updated= await prisma.event.update({
    where: {
      id
    },
    data: {
      startDateTime,
      endDateTime
    }
  })
  return updated !== null
}

export async function setSeatsPerTimeSlot(id: string, seatsPerTimeSlot: number) {
  const updated= await prisma.event.update({
    where: {
      id
    },
    data: {
      seatsPerTimeSlot,
    }
  })
  await updateSeatsAvailable(id)
  return updated !== null
}

export async function updateSeatsAvailable(id: string) {
  const event= await getEventDAO(id)
  if (!event) throw new Error("Event not found")
  if (event.type !== EventType.FIXED_DATE) throw new Error("Event is not a fixed date event")

  const totalSeats= event.seatsPerTimeSlot || 0
  const allBookings= await getBookingsDAO(id)
  const bookings= allBookings.filter(booking => booking.status === "RESERVADO" || booking.status === "CONFIRMADO" || booking.status === "PAGADO")
  const bookedSeats= bookings.reduce((acc, booking) => { return acc + booking.seats }, 0)
  const seatsAvailable= totalSeats - bookedSeats
  const updated= await prisma.event.update({
    where: {
      id
    },
    data: {
      seatsAvailable
    }
  })
  return updated !== null
}

export async function updateEventMetadata(id: string) {
  const event= await getFullEventDAO(id)
  if (!event) throw new Error("Event not found")

  const fields= event.fields.sort((a, b) => a.order - b.order)
  const properties= fields.map((field) => ({
    name: field.name,
    type: (field.type === "list" ? "array" : field.type) as "string" | "number" | "boolean" | "array",
    description: field.description,
    required: field.required,
    items: field.type === "list" ? {
      type: "string" as const,
      enum: field.listOptions ?? []
    } : undefined
  }))
 
  const updatedMetadata= generateMetadata(properties)

  const updated = await prisma.event.update({
    where: {
      id
    },
    data: {
      metadata: updatedMetadata
    }
  })

  console.log("metadata: ", updated.metadata)

  return updated
}

export type Property= {
  name: string
  type: "string" | "number" | "boolean" | "array"
  description: string
  required: boolean
  items?: {
    type: "string"
    enum: string[]
  }
}

export function generateMetadata(properties: Property[]): string {
  const metadata= properties.reduce((acc: { [key: string]: { type: string; description: string, required: boolean, items?: { type: string, enum: string[] } } }, property) => {
    if (property.type === "array") {
      acc[property.name] = {
        type: property.type,
        description: property.description,
        required: property.required,
        items: {
          type: "string",
          enum: property.items?.enum ?? []
        }
      };
    } else {
      acc[property.name] = {
        type: property.type,
        description: property.description,
        required: property.required
      };
    }
    return acc;
  }, {})

  const jsonString = JSON.stringify(metadata, null, 2)

  try {
    JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing metadata: ", error);
    throw new Error("Error parsing metadata");
  }

  return jsonString;
}

export async function getTagsOfEvent(eventId: string) {
  const found = await prisma.event.findUnique({
    where: {
      id: eventId
    }
  })

  return found?.tags
}

export async function setTagsOfEvent(eventId: string, tags: string[]) {
  const updated = await prisma.event.update({
    where: {
      id: eventId
    },
    data: {
      tags
    }
  })
}

export async function setMoveToStageIdEvent(eventId: string, moveToStageId: string) {
  const updated = await prisma.event.update({
    where: {
      id: eventId
    },
    data: {
      moveToStageId
    }
  })
  return updated !== null
}

export async function setEventNotifyPhones(id: string, notifyPhones: string[]) {
  const updated = await prisma.event.update({
    where: {
      id
    },
    data: {
      notifyPhones
    }
  })
  return updated !== null
}

export async function addReminderDefinitionToEvent(eventId: string, reminderDefinitionId: string) {
  const updated = await prisma.eventReminderDefinition.create({
    data: {
      eventId,
      reminderDefinitionId
    }
  })
  return updated !== null
}

export async function removeReminderDefinitionFromEvent(eventId: string, reminderDefinitionId: string) {
  const updated = await prisma.eventReminderDefinition.delete({
    where: {
      eventId_reminderDefinitionId: {
        eventId,
        reminderDefinitionId
      }
    }
  })
  return updated !== null
}

