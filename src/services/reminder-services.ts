import * as z from "zod"
import { prisma } from "@/lib/db"
import { ContactDAO, getContactDAO } from "./contact-services"
import { getReminderDefinitionDAO, ReminderDefinitionDAO } from "./reminder-definition-services"
import { AbandonedOrderStatus, ReminderStatus, ReminderType } from "@prisma/client"
import { addMinutes, addSeconds, format } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { Client } from "@upstash/qstash"
import { getClientName } from "./clientService"
import { BookingDAO } from "./booking-services"
import { getAvailableProcessors } from "./reminder-processors"
import { getAbandonedOrderById } from "./abandoned-orders-service"

const baseUrl= process.env.NEXTAUTH_URL === "http://localhost:3000" ? "https://local.rctracker.dev" : process.env.NEXTAUTH_URL
const client = new Client({ token: process.env.QSTASH_TOKEN! })

// Tipo actualizado para incluir type y abandonedOrder
export type ReminderDAO = {
	id: string
	status: ReminderStatus
	type: ReminderType
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
	abandonedOrder: any | null
	abandonedOrderId: string | null
	createdAt: Date
	updatedAt: Date
}

export const ReminderSchema = z.object({	
	eventTime: z.date({required_error: "targetDate is required."}),
	contactId: z.string().min(1, "contactId is required."),
	reminderDefinitionId: z.string().min(1, "reminderDefinitionId is required."),
	bookingId: z.string().optional(),
	abandonedOrderId: z.string().optional(),
	type: z.nativeEnum(ReminderType).default(ReminderType.GENERIC),
  eventName: z.string().optional(),
})

export type ReminderFormValues = z.infer<typeof ReminderSchema>

// Obtenemos los procesadores del archivo dedicado
const reminderProcessors = getAvailableProcessors();

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
      booking: true,
    }
  })
  
  // Convertir a ReminderDAO manteniendo la compatibilidad con el tipo esperado
  return found.map(reminder => ({
    ...reminder,
    type: reminder.type || ReminderType.GENERIC,
    abandonedOrder: null,
  })) as unknown as ReminderDAO[];
}

export async function getReminderDAO(id: string) {
  const found = await prisma.reminder.findUnique({
    where: {
      id
    },
    include: {
      contact: true,
      reminderDefinition: true,
      booking: true,
    }
  })
  
  if (!found) return null as unknown as ReminderDAO;
  
  // Buscar la orden abandonada usando el servicio específico
  let abandonedOrder = null;
  if (found.abandonedOrderId) {
    abandonedOrder = await getAbandonedOrderById(found.abandonedOrderId);
  }
  
  // Reconstruir el objeto con los campos necesarios
  return {
    ...found,
    type: found.type || ReminderType.GENERIC,
    abandonedOrder,
  } as unknown as ReminderDAO;
}

// Función modificada para incluir el tipo y la relación opcional con AbandonedOrder
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
  
  // Si es un recordatorio de orden abandonada, hidratar {productosCantidad}
  if (data.type === ReminderType.ABANDONED_ORDER && data.abandonedOrderId) {
    // Usar el servicio específico en lugar de acceder directamente a prisma
    const abandonedOrder = await getAbandonedOrderById(data.abandonedOrderId);
    
    if (abandonedOrder && abandonedOrder.productos) {
      // La propiedad productos es un array de strings (cada uno es un JSON)
      const productosCount = abandonedOrder.productos.length;
      message = message.replace('{productosCantidad}', productosCount.toString());
    } else {
      // Si no hay orden o productos, usar "0"
      message = message.replace('{productosCantidad}', "0");
    }
  }

  const minutesDelay = reminderDefinition.minutesDelay || 0
  const isPast = reminderDefinition.past
  
  const scheduledFor = isPast 
    ? addMinutes(eventTime, -minutesDelay)
    : addMinutes(eventTime, minutesDelay)
  
  const oneWeekFromNow = addSeconds(new Date(), 604800)
  if (scheduledFor > oneWeekFromNow) {
    // Para ERROR, crear sin incluir 'type' como propiedad adicional
    const created = await prisma.reminder.create({
      data: {
        eventTime,
        scheduledFor,
        message, 
        error: "Max delay is 1 week.",
        contactId: contact.id,
        reminderDefinitionId: reminderDefinition.id,
        bookingId: data.bookingId || null,
        abandonedOrderId: data.abandonedOrderId || null,
        status: ReminderStatus.ERROR,
        type: data.type,
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
      bookingId: data.bookingId || null,
      abandonedOrderId: data.abandonedOrderId || null,
      type: data.type,
    }
  })  

  // En caso de orden abandonada, usar una URL diferente para la API de procesamiento
  let apiUrl = `${baseUrl}/api/process-reminder`;
  if (data.type === ReminderType.ABANDONED_ORDER) {
    apiUrl = `${baseUrl}/api/process-abandoned-order-reminder`;
  }

  const notBefore = Math.floor(scheduledFor.getTime() / 1000)
  const clientName = await getClientName(contact.clientId)
  const scheduledId = await scheduleReminder(created.id, notBefore, clientName, apiUrl)
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
    data: {
      eventTime: data.eventTime,
      contactId: data.contactId,
      reminderDefinitionId: data.reminderDefinitionId,
      bookingId: data.bookingId,
      abandonedOrderId: data.abandonedOrderId,
      type: data.type,
    }
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

export async function scheduleReminder(reminderId: string, notBefore: number, clientName: string, apiUrl?: string) {
  const url = apiUrl || `${baseUrl}/api/process-reminder`;
  const result= await client.publishJSON({
    url,
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

// Función modificada para usar el procesador adecuado según el tipo
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
  
  // Buscar el procesador adecuado para este tipo de recordatorio
  for (const processor of reminderProcessors) {
    if (processor.canProcess(reminder)) {
      return await processor.process(reminder);
    }
  }
  
  // Si llegamos aquí, es porque no encontramos un procesador adecuado
  throw new Error(`No se encontró un procesador para recordatorios de tipo: ${reminder.type}`);
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