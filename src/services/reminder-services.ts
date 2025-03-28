import * as z from "zod"
import { prisma } from "@/lib/db"
import { ContactDAO, getContactDAO } from "./contact-services"
import { getReminderDefinitionDAO, ReminderDefinitionDAO } from "./reminder-definition-services"
import { ReminderStatus } from "@prisma/client"
import { addMinutes, addSeconds, format } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { sendMessageToContact } from "./campaign-services"
import { Client } from "@upstash/qstash"
import { getClientName } from "./clientService"
import { BookingDAO } from "./booking-services"

const baseUrl= process.env.NEXTAUTH_URL === "http://localhost:3000" ? "https://local.rctracker.dev" : process.env.NEXTAUTH_URL
const client = new Client({ token: process.env.QSTASH_TOKEN! })

export type ReminderDAO = {
	id: string
	status: ReminderStatus
	eventTime: Date
	scheduledFor: Date
	message: string
	conversationId: string | null
	scheduledId: string | null
	sentAt: Date | undefined
	error: string | undefined
	contact: ContactDAO
	contactId: string
	reminderDefinition: ReminderDefinitionDAO
	reminderDefinitionId: string
	booking: BookingDAO | null
	bookingId: string | null
	createdAt: Date
	updatedAt: Date
}

export const ReminderSchema = z.object({	
	eventTime: z.date({required_error: "targetDate is required."}),
	contactId: z.string().min(1, "contactId is required."),
	reminderDefinitionId: z.string().min(1, "reminderDefinitionId is required."),
	bookingId: z.string().optional(),
  eventName: z.string().optional(),
})

export type ReminderFormValues = z.infer<typeof ReminderSchema>


export async function getRemindersDAO(clientId: string) {
  const found = await prisma.reminder.findMany({
    where: {
      contact: {
        clientId
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      contact: true,
      reminderDefinition: true,
      booking: true
    }
  })
  return found as ReminderDAO[]
}

export async function getReminderDAO(id: string) {
  const found = await prisma.reminder.findUnique({
    where: {
      id
    },
    include: {
      contact: true,
      reminderDefinition: true,
      booking: true
    }
  })
  return found as ReminderDAO
}


    
export async function createReminder(data: ReminderFormValues) {
  const reminderDefinition = await getReminderDefinitionDAO(data.reminderDefinitionId)
  if (!reminderDefinition) {
    throw new Error("Reminder definition not found")
  }
  const contact = await getContactDAO(data.contactId)
  if (!contact) {
    throw new Error("Contact not found")
  }
  const eventTime = data.eventTime
  const messageTemplate = reminderDefinition.message
  const timezone= "America/Montevideo"
  const eventTimeInUyTimezone = toZonedTime(eventTime, timezone)
  let message = messageTemplate.replace('{nombre}', contact.name)
  message = message.replace('{fecha}', format(eventTimeInUyTimezone, 'dd/MM/yyyy'))
  message = message.replace('{hora}', format(eventTimeInUyTimezone, 'HH:mm'))
  message = message.replace('{fecha_y_hora}', format(eventTimeInUyTimezone, 'dd/MM/yyyy HH:mm'))
  message = message.replace('{evento}', data.eventName || "")

  const minutesDelay = reminderDefinition.minutesDelay || 0
  const isPast = reminderDefinition.past
  
  const scheduledFor = isPast 
    ? addMinutes(eventTime, -minutesDelay)
    : addMinutes(eventTime, minutesDelay)
  
  const oneWeekFromNow = addSeconds(new Date(), 604800)
  if (scheduledFor > oneWeekFromNow) {
    const created = await prisma.reminder.create({
      data: {
        eventTime,
        scheduledFor,
        message, 
        error: "Max delay is 1 week.",
        contactId: contact.id,
        reminderDefinitionId: reminderDefinition.id,
        bookingId: data.bookingId || null,
        status: ReminderStatus.ERROR
      }
    })
    return created
  }

  const created = await prisma.reminder.create({
    data: {
      eventTime,
      scheduledFor,
      message,
      contactId: contact.id,
      reminderDefinitionId: reminderDefinition.id,
      bookingId: data.bookingId || null
    }
  })  
  const notBefore = Math.floor(scheduledFor.getTime() / 1000)
  const clientName = await getClientName(contact.clientId)
  const scheduledId = await scheduleReminder(created.id, notBefore, clientName)
  const updated = await prisma.reminder.update({
    where: {
      id: created.id
    },
    data: {
      scheduledId,
      status: ReminderStatus.PROGRAMADO
    }
  })

  return updated
}

export async function updateReminder(id: string, data: ReminderFormValues) {
  const updated = await prisma.reminder.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteReminder(id: string) {
  const deleted = await prisma.reminder.delete({
    where: {
      id
    },
  })
  return deleted
}

export async function scheduleReminder(reminderId: string, notBefore: number, clientName: string) {
  const result= await client.publishJSON({
    url: `${baseUrl}/api/process-reminder`,
    body: {
      reminderId,
      clientName
    },
    notBefore,
    retries: 0
  })
  console.log("Upstash result: ", result)
  
  return result.messageId
}



export async function processReminder(reminderId: string) {
  const reminder = await getReminderDAO(reminderId)
  if (!reminder) {
    throw new Error("Recordatorio no encontrado")
  }
  if (reminder.status === ReminderStatus.ENVIADO || reminder.status === ReminderStatus.CANCELADO) {
    console.log("Recordatorio ya enviado o cancelado")
    return reminder
  }
  if (reminder.status !== ReminderStatus.PROGRAMADO) {
    throw new Error("Recordatorio no está en estado PROGRAMADO. Estado actual: " + reminder.status)
  }
  const contact = reminder.contact
  const message = reminder.message
  const conversationId = await sendMessageToContact(contact.clientId, contact, message, [], null, "")
  const updated = await prisma.reminder.update({
    where: {
      id: reminderId
    },
    data: {
      status: ReminderStatus.ENVIADO,
      sentAt: new Date(),
      conversationId
    }
  })
  return updated
}

export async function setReminderStatus(reminderId: string, status: ReminderStatus, error?: string) {
  const updated = await prisma.reminder.update({
    where: {
      id: reminderId
    },
    data: {
      status,
      error
    }
  })
  return updated
}

export async function cancelReminder(reminderId: string) {
  const reminder = await getReminderDAO(reminderId)
  if (!reminder) {
    throw new Error("Recordatorio no encontrado")
  }
  if (reminder.status !== ReminderStatus.PROGRAMADO) {
    throw new Error("Recordatorio no está en estado PROGRAMADO. Estado actual: " + reminder.status)
  }
  const updated = await prisma.reminder.update({
    where: {
      id: reminderId
    },
    data: {
      status: ReminderStatus.CANCELADO
    }
  })
  return updated
}