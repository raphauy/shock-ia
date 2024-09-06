import * as z from "zod"
import { prisma } from "@/lib/db"
import { getClient } from "./clientService"
import { generateSlug } from "@/lib/utils"
import { EventType } from "@prisma/client"
import { log } from "node:console"

export type EventDAO = {
	id: string
	name: string
	slug: string
  color: string
	duration: number
	description: string | undefined
	address: string | undefined
	seatsPerTimeSlot: number | undefined
	price: number | undefined
	isArchived: boolean
  availability: string[]
  type: EventType
	createdAt: Date
	updatedAt: Date
	clientId: string
}

export const nameSchema = z.object({
	name: z.string().min(1, "name is required."),
})

export type NameFormValues = z.infer<typeof nameSchema>

export const eventSchema = z.object({
	name: z.string().min(1, "name is required."),
  slug: z.string().min(1, "slug is required."),
  color: z.string().min(1, "color is required."),
  duration: z.number().min(1, "duration is required."),
  description: z.string().min(1, "description is required."),
  address: z.string().min(1, "address is required."),
  seatsPerTimeSlot: z.number().min(1, "seatsPerTimeSlot is required."),
  price: z.number().min(1, "price is required."),
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
    
export async function createEvent(clientId: string, name: string) {
  const client= await getClient(clientId)
  if (!client) throw new Error("Client not found")

  const slug= generateSlug(name)
  const slugAvailable= await checkSlugAvailability(clientId, slug)
  if (!slugAvailable) throw new Error("El slug generado para este nombre ya existe")

  const created = await prisma.event.create({
    data: {
      clientId,
      name,
      slug,
      color: "#bfe1ff",
      duration: 60,
      description: "Modifica esta descripción",
      address: "Modifica esta dirección",
      seatsPerTimeSlot: 1,
      price: 0,
      isArchived: false,
      availability: [],
    }
  })
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