"use server"
  
import { revalidatePath } from "next/cache"
import { NotificationDAO, NotificationFormValues, createNotification, updateNotification, getNotificationDAO, deleteNotification } from "@/services/notification-services"


export async function getNotificationDAOAction(id: string): Promise<NotificationDAO | null> {
    return getNotificationDAO(id)
}

export async function deleteNotificationAction(id: string): Promise<NotificationDAO | null> {    
    const deleted= await deleteNotification(id)

    revalidatePath("/crm/notifications")

    return deleted as NotificationDAO
}

