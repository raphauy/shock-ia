import { JsonValue } from "@prisma/client/runtime/library";
import { format } from "date-fns";
import { RepoDataDAO } from "./repodata-services";
import { es } from "date-fns/locale";
import axios from "axios";
import { BookingDAO } from "./booking-services";
import { getLastChatwootConversationIdByPhoneNumber } from "./contact-services";
import { sendTextToConversation } from "./chatwoot";
import { getChatwootAccountId, getClient, getWhatsappInstance } from "./clientService";
import { formatInTimeZone } from "date-fns-tz";
import { getWebhookStatus } from "./wrc-sdk";
import { getValue } from "./config-services";

type RepoDataEntryResponse = {
    id: string,
    phone: string,
    functionName: string,
    clientId: string,
    clientName: string,
    clientSlug: string,
    conversationId: string,
    date: string,
    data: String,
    booking?: BookingDAO
}

type RepoDataWithClientName = RepoDataDAO & {
    client: {
        name: string,
        slug: string
    }
}

export type RepoDataWithClientNameAndBooking = RepoDataWithClientName & {
    booking?: BookingDAO
}

export function getProcessedRepoData(repoData: RepoDataWithClientNameAndBooking): Record<string, any> {
    const parsedData = JSON.parse(repoData.data as string);

    const jsonReplaced = Object.keys(parsedData).reduce((acc, key) => {
      acc[key] = parsedData[key] === true ? "SI" : parsedData[key] === false ? "NO" : parsedData[key];
      return acc;
    }, {} as Record<string, any>);

    return jsonReplaced
}

export async function sendWebhookNotification(webhookUrl: string, repoData: RepoDataWithClientNameAndBooking) {
    const jsonReplaced = getProcessedRepoData(repoData)

    const data: RepoDataEntryResponse = {
        id: repoData.id,
        phone: repoData.phone,
        functionName: repoData.functionName,
        clientId: repoData.clientId,
        clientName: repoData.client.name,
        clientSlug: repoData.client.slug,
        conversationId: repoData.conversationId,
        date: format(repoData.createdAt, "yyyy-MM-dd HH:mm", { locale: es }),
        data: JSON.stringify(jsonReplaced),
    }

    // if there is a booking, add the booking data to the response
    if (repoData.booking) {
        data.booking = repoData.booking
    }

    const init= new Date().getTime()
    try {
        // const response = await axios.post(webhookUrl, data, {
        const response = await axios.post(webhookUrl, data, {
                headers: {
                'Content-Type': 'application/json',
            },
            timeout: 20000, // 20 segundos
        })
        const elapsedTime = new Date().getTime() - init
        console.log(`Request took ${elapsedTime} milliseconds`)

        if (response.status !== 200) {
            console.error(`Failed to send webhook notification to ${webhookUrl} `, response.status, response.statusText)
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
            console.error('Request timed out');
        } else {
            const statusCode = (error as any).response?.status
            // if error es 400 log only the message
            if (statusCode === 400) {
                console.error('Failed to send webhook notification:', (error as any).response?.data?.message)
            } else {
                console.error('Failed to send webhook notification:', error)
            }
        }
    }
}

export async function sendFCNotifications(notifyPhones: string[], repoData: RepoDataWithClientNameAndBooking) {
    const jsonReplaced = getProcessedRepoData(repoData)
    console.log("jsonReplaced", jsonReplaced)

    const phone= repoData.phone
    const functionName= repoData.functionName
    const timezone= "America/Montevideo"
    const date= formatInTimeZone(repoData.createdAt, timezone, "yyyy-MM-dd HH:mm", { locale: es })

    // an special field is name, if it is not present, use the client name
    const name= jsonReplaced.nombre || undefined

    // create a text message to send to the users, use de FC name and the data
    let textMessage= `
**${functionName}**
${name ? `\n**Nombre:** ${name}` : ""}
**Teléfono:** ${phone}
**Fecha:** ${date}
---------------------------------
**Datos:**
`
    for (const key in jsonReplaced) {
        if (key !== "nombre") {
            textMessage+= `    **-${key}:** ${jsonReplaced[key]}
`
        }
    }

    console.log("message to send:")
    console.log(textMessage)

    const chatwootAccountId= await getChatwootAccountId(repoData.clientId)
    if (!chatwootAccountId) throw new Error("Chatwoot account not found for client " + repoData.clientId)

    // iterate over the notifyPhones array and send the message to each phone
    for (const destinationPhone of notifyPhones) {
        const chatwootConversationId= await getLastChatwootConversationIdByPhoneNumber(destinationPhone, repoData.clientId)
        if (!chatwootConversationId) {
            // log and continue
            console.log(`Chatwoot conversation not found for phone ${destinationPhone}`)
            continue
        } else {
            await sendTextToConversation(Number(chatwootAccountId), chatwootConversationId, textMessage)
            console.log(`Message sent to ${destinationPhone}`)
        }
    }
}


export async function sendEventNotifications(notifyPhones: string[], repoData: RepoDataWithClientNameAndBooking) {
    const jsonReplaced = getProcessedRepoData(repoData)
    console.log("jsonReplaced", jsonReplaced)

    const phone= repoData.phone
    const functionName= repoData.functionName
    const timezone= "America/Montevideo"
    const date= formatInTimeZone(repoData.createdAt, timezone, "yyyy-MM-dd HH:mm", { locale: es })

    // an special field is name, if it is not present, use the client name
    const name= jsonReplaced.nombre || undefined

    const booking= repoData.booking
    if (!booking) throw new Error("Booking not found")

    const bookingStart= format(booking.start, "yyyy-MM-dd HH:mm", { locale: es })
    const bookingEnd= format(booking.end, "yyyy-MM-dd HH:mm", { locale: es })
    const seats= booking.seats
    const price= booking.price
    const status= booking.status

    // create a text message to send to the users, use de FC name and the data
    let textMessage= `
**Reserva para ${functionName}**
---------------------------------
${name ? `**Nombre:** ${name}` : ""}
**Teléfono:** ${phone}
**Fecha:** ${date}
---------------------------------
**Reserva:**
    - **Fecha:** ${bookingStart} - ${bookingEnd}
    - **Cupos:** ${seats}
    - **Estado:** ${status}
---------------------------------
**Datos:**
`
    for (const key in jsonReplaced) {
        if (key !== "nombre") {
            textMessage+= `    **-${key}:** ${jsonReplaced[key]}
`
        }
    }

    console.log("message to send:")
    console.log(textMessage)

    const chatwootAccountId= await getChatwootAccountId(repoData.clientId)
    if (!chatwootAccountId) throw new Error("Chatwoot account not found for client " + repoData.clientId)

    // iterate over the notifyPhones array and send the message to each phone
    for (const destinationPhone of notifyPhones) {
        const chatwootConversationId= await getLastChatwootConversationIdByPhoneNumber(destinationPhone, repoData.clientId)
        if (!chatwootConversationId) {
            // log and continue
            console.log(`Chatwoot conversation not found for phone ${destinationPhone}`)
            continue
        } else {
            await sendTextToConversation(Number(chatwootAccountId), chatwootConversationId, textMessage)
            console.log(`Message sent to ${destinationPhone}`)
        }
    }
}

//WHATSAPP_DISCONNECT_NOTIFICATIONS
export async function  sendWhatsappDisconnectNotification(clientId: string, state: string) {
    const notifyPhonesValue= await getValue("WHATSAPP_DISCONNECT_NOTIFICATIONS")
    const notifyPhones= notifyPhonesValue?.split(",") || []
    if (notifyPhones.length === 0) {
        console.log("No notify phones found for whatsapp disconnect notification")
        return
    }

    const client= await getClient(clientId)
    if (!client) throw new Error("Client not found")

    const whatsappInstance= await getWhatsappInstance(client.id)
    if (!whatsappInstance) throw new Error("Whatsapp instance not found for client " + client.name)

    const instanceName= whatsappInstance.name
    const webhookStatus= await getWebhookStatus(instanceName)
    if (!webhookStatus) throw new Error("Webhook status not found for instance " + instanceName)

    if (!webhookStatus.enabled) {
        console.log("Webhook is not enabled for instance " + instanceName)
        return
    }

    const adminClientId= await getValue("WHATSAPP_DISCONNECT_ADMIN_CLIENT_ID")
    if (!adminClientId) throw new Error("WHATSAPP_DISCONNECT_ADMIN_CLIENT_ID is not set")

    const adminChatwootAccountId= await getChatwootAccountId(adminClientId)
    if (!adminChatwootAccountId) throw new Error("Chatwoot account not found for client " + adminClientId)

    const appURL= process.env.NEXTAUTH_URL
    if (!appURL) throw new Error("NEXTAUTH_URL is not set")

    const estado= state === "close" ? "Desconectado" : state === "open" ? "Conectado" : state === "connecting" ? "Conectando" : "Desconocido"

    const text= `**WhatsApp desconectado**

Cliente: **${client.name}**
Estado: **${estado}**
Conectar: ${appURL}/client/${client.slug}/crm/whatsapp
`

    for (const destinationPhone of notifyPhones) {
        console.log("destinationPhone: ", destinationPhone)
        console.log("adminClientId: ", adminClientId)
        const chatwootConversationId= await getLastChatwootConversationIdByPhoneNumber(destinationPhone, adminClientId)
        if (!chatwootConversationId) {
            console.log(`Chatwoot conversation not found for phone ${destinationPhone}`)
            continue
        } else {
            await sendTextToConversation(Number(adminChatwootAccountId), chatwootConversationId, text)
        }
    }

    console.log("Whatsapp disconnect notification sent to " + notifyPhones.length + " phones")
    return true
}