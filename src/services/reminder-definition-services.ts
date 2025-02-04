import * as z from "zod"
import { prisma } from "@/lib/db"

export type ReminderDefinitionDAO = {
	id: string
	name: string
	description: string | undefined
	message: string
	minutesBefore: number
	clientId: string
	createdAt: Date
	updatedAt: Date
}

export const ReminderDefinitionSchema = z.object({
	name: z.string().min(1, "name is required."),
	description: z.string().optional(),
	message: z.string().min(1, "message is required."),
	minutesBefore: z.string().refine((val) => !isNaN(Number(val)), { message: "(debe ser un número)" }),
	clientId: z.string().min(1, "clientId is required."),
})

export type ReminderDefinitionFormValues = z.infer<typeof ReminderDefinitionSchema>


export async function getReminderDefinitionsDAO(clientId: string) {
  const found = await prisma.reminderDefinition.findMany({
    where: {
      clientId
    },
    orderBy: {
      id: 'asc'
    },
  })
  return found as ReminderDefinitionDAO[]
}

export async function getReminderDefinitionDAO(id: string) {
  const found = await prisma.reminderDefinition.findUnique({
    where: {
      id
    },
  })
  return found as ReminderDefinitionDAO
}


    
export async function createReminderDefinition(data: ReminderDefinitionFormValues) {
  const minutesBefore= Number(data.minutesBefore)
  const created = await prisma.reminderDefinition.create({
    data: {
      ...data,
      minutesBefore
    }
  })
  return created
}

export async function updateReminderDefinition(id: string, data: ReminderDefinitionFormValues) {
  const minutesBefore= Number(data.minutesBefore) 
  const updated = await prisma.reminderDefinition.update({
    where: {
      id
    },
    data: {
      ...data,
      minutesBefore
    }
  })
  return updated
}

export async function deleteReminderDefinition(id: string) {
  const deleted = await prisma.reminderDefinition.delete({
    where: {
      id
    },
  })
  return deleted
}

export async function getReminderDefinitionsDAOByEventId(eventId: string) {
  const found = await prisma.eventReminderDefinition.findMany({
    where: {
      eventId
    },
    include: {
      reminderDefinition: {
        include: {
          reminders: true
        }
      }
    }
  })
  return found.map((item) => item.reminderDefinition)
}