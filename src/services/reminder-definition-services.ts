import * as z from "zod"
import { prisma } from "@/lib/db"

export type ReminderDefinitionDAO = {
	id: string
	name: string
	description: string | null
	message: string
	minutesDelay: number | null
	past: boolean
	clientId: string
	createdAt: Date
	updatedAt: Date
}

export const ReminderDefinitionSchema = z.object({
	name: z.string().min(1, "name is required."),
	description: z.string().optional(),
	message: z.string().min(1, "message is required."),
	minutesDelay: z.string().refine((val) => val && !isNaN(Number(val)), { message: "(debe ser un número)" }),
	past: z.boolean(),
})

export type ReminderDefinitionFormValues = z.infer<typeof ReminderDefinitionSchema>


export async function getReminderDefinitionsDAO(clientId: string, past: boolean): Promise<ReminderDefinitionDAO[]> {
  const found = await prisma.reminderDefinition.findMany({
    where: {
      clientId,
      past: past
    },
    orderBy: {
      id: 'asc'
    },
  })
  return found as ReminderDefinitionDAO[]
}

export async function getReminderDefinitionDAO(id: string): Promise<ReminderDefinitionDAO | null> {
  const found = await prisma.reminderDefinition.findUnique({
    where: {
      id
    },
  })
  return found as ReminderDefinitionDAO | null
}


    
export async function createReminderDefinition(data: ReminderDefinitionFormValues, clientId: string) {
  const delay = Number(data.minutesDelay)
  const created = await prisma.reminderDefinition.create({
    data: {
      name: data.name,
      description: data.description,
      message: data.message,
      clientId: clientId,
      minutesDelay: delay,
      past: data.past,
      minutesBefore: delay
    }
  })
  return created
}

export async function updateReminderDefinition(id: string, data: ReminderDefinitionFormValues) {
  const delay = Number(data.minutesDelay)
  const updated = await prisma.reminderDefinition.update({
    where: {
      id
    },
    data: {
      name: data.name,
      description: data.description,
      message: data.message,
      minutesDelay: delay,
      past: data.past,
      minutesBefore: delay
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