import * as z from "zod"
import { prisma } from "@/lib/db"
import { NotificationType } from "@prisma/client"

export type NotificationDAO = {
	id: string
	phone: string
	message: string
	type: NotificationType
	sentAt: Date
	error: string | undefined
	bookingId: string | undefined
	clientId: string
}

export const NotificationSchema = z.object({
	phone: z.string().min(1, "phone is required."),
	message: z.string().min(1, "message is required."),
	type: z.nativeEnum(NotificationType),
	bookingId: z.string().optional(),
	clientId: z.string().min(1, "clientId is required."),
})

export type NotificationFormValues = z.infer<typeof NotificationSchema>


export async function getNotificationsDAO(clientId: string) {
  const found = await prisma.notification.findMany({
    where: {
      clientId
    },
    orderBy: {
      id: 'asc'
    },
  })
  return found as NotificationDAO[]
}

export async function getNotificationDAO(id: string) {
  const found = await prisma.notification.findUnique({
    where: {
      id
    },
  })
  return found as NotificationDAO
}


    
export async function createNotification(data: NotificationFormValues) {
  // TODO: implement createNotification
  const created = await prisma.notification.create({
    data
  })
  return created
}

export async function updateNotification(id: string, data: NotificationFormValues) {
  const updated = await prisma.notification.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteNotification(id: string) {
  const deleted = await prisma.notification.delete({
    where: {
      id
    },
  })
  return deleted
}

export async function setError(id: string, error: string) {
  const updated = await prisma.notification.update({
    where: {
      id
    },
    data: {
      error
    }
  })
  return updated
}