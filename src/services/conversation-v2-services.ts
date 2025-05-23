// Definimos los tipos basados en la estructura real de los mensajes de Chatwoot
import { getMostRecentUserMessage } from "@/lib/ai/chat-utils";
import { myProvider } from "@/lib/ai/providers";
import { getAllClientTools } from "@/lib/ai/tools";
import { prisma } from "@/lib/db";
import { EventType, Message } from '@/lib/generated/prisma';
import { ChatwootAttachment, IncomingChatwootMessage } from "@/services/chatwoot-types";
import { getChatwootAccountId, getClient, getClientHaveCRM, getClientIdByChatwootAccountId } from "@/services/clientService";
import { getContactByChatwootId, getContactByPhone } from "@/services/contact-services";
import { createConversation, getActiveConversation, getSystemMessage, setLastMessageWasAudio } from "@/services/conversationService";
import { MessageFormValues, saveMessage } from "@/services/messages-service";
import { generateAudioFromElevenLabs } from "@/services/model-services";
import { Attachment, FileUIPart, TextUIPart, UIMessage } from "@ai-sdk/ui-utils";
import { appendResponseMessages, generateText } from "ai";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { getFutureBookingsDAOByPhone } from "./booking-services";
import { sendAudioToConversation, sendTextToConversation } from "./chatwoot";
import { getValue } from "./config-services";
import { getClientCustomFields } from "./customfield-services";
import { getDocumentsDAOByClient } from "./document-services";
import { getActiveEventsDAOByClientId } from "./event-services";
import { getFieldValuesByContactId } from "./fieldvalue-services";
import { getStageByChatwootId } from "./stage-services";
import { transcribeAudio } from "./transcribe-services";


/**
 * Guarda y procesa un mensaje entrante de Chatwoot
 * 
 * Este método:
 * 1. Valida el mensaje
 * 2. Identifica el cliente y el contacto
 * 3. Guarda el mensaje en la base de datos
 * 4. Procesa el mensaje con la IA
 * 5. Envía la respuesta de vuelta a Chatwoot
 */
export async function saveChatwootMessage(message: IncomingChatwootMessage): Promise<{success: boolean, error?: string, messageId?: string}> {
    try {
        const accountId= message.account.id
        const clientId= await getClientIdByChatwootAccountId(String(accountId))
        if (!clientId) {
            console.log("error: ", "clientId not found")
            return {
                success: false,
                error: "clientId not found"
            }
        }

        console.log("Procesando mensaje de Chatwoot en V2");

        const senderName= message.sender.name
        const senderPhone= message.sender.phone_number || senderName
        const chatwootConversationId= message.conversation.id
        
        const chatwootContactId= message.sender.id
        const conversationId= await getActiveConversationId(senderPhone, chatwootContactId, clientId, chatwootConversationId)
        
        const parts = await convertChatwootMessageToParts(message, conversationId);
        
        let textContent = message.content || "";
        
        if (!textContent && message.attachments && message.attachments.length > 0) {
            const attachmentTypes = message.attachments.map((a: ChatwootAttachment) => a.file_type).join(", ");
            textContent = `[Mensaje con ${attachmentTypes}]`;
        }
        
        const attachments = convertChatwootAttachments(message.attachments);
        
        const messageFormValues: MessageFormValues = {
            conversationId,
            role: "user",
            content: textContent,
            parts,
            attachments
        };
        
        const savedMessage = await saveMessage(messageFormValues);
        console.log(`Mensaje guardado con ID: ${savedMessage.id}`);
        
        return {
            success: true,
            messageId: savedMessage.id
        };
        
    } catch (error) {
        console.error("Error procesando mensaje de Chatwoot V2:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error desconocido"
        };
    }
}

export enum IncomingMessageStatus {
    READY,
    SKIPPED,
    ERROR
}

/**
 * Procesa un mensaje entrante utilizando el modelo de IA correspondiente
 * y guarda la respuesta en la base de datos
 * 
 * @param messageId ID del mensaje a procesar
 */
export async function processIncomingMessage(messageId: string, clientId: string): Promise<boolean> {
    
    const status= await getIncomingMessageStatus(messageId)
    console.log(`********** ${status === IncomingMessageStatus.READY ? "READY" : "SKIPPED"} **********`)
    if (status !== IncomingMessageStatus.READY) {
        return false
    }

    const conversationId= await getConversationIdByMessageId(messageId)
    if (!conversationId) {
        console.log("conversationId not found, skipping message")
        return false
    }

    const conversation= await getConversationWithContact(conversationId)
    if (!conversation) {
        console.log("conversation not found, skipping message")
        return false
    }

    const contact= conversation.contact
    if (!contact) {
        console.log("contact or phone not found, skipping message")
        return false
    }

    const client= await getClient(clientId)
    if (!client) {
        console.log("client not found, skipping message")
        return false
    }

    if (!client.prompt) {
        console.log("client prompt not found, client: ", client.name)
        return false
    }

    const chatwootAccountId= await getChatwootAccountId(client.id)
    if (!chatwootAccountId) throw new Error("chatwootAccountId not found")
    if (!conversation.chatwootConversationId) throw new Error("chatwootConversationId not found")

    console.log("Iniciando procesamiento con IA...");
    try {

        let maxMessages= 20
        const MAX_MESSAGES_TO_PROCESS= await getValue("MAX_MESSAGES_TO_PROCESS")
        if (MAX_MESSAGES_TO_PROCESS) {
            maxMessages= parseInt(MAX_MESSAGES_TO_PROCESS)
        }

        const messagesFromDb= await getConversationMessages(conversationId, maxMessages)
        const uiMessages= convertToUIMessages(messagesFromDb)
        const userMessage = getMostRecentUserMessage(uiMessages);
        if (!userMessage) {
            return false
        }

        const stage= await getStageByChatwootId(String(contact.chatwootId), clientId)
        if (stage && !stage.isBotEnabled) {
            console.log("Stage disabled, skipping message")
            return false
        }

        const phone= contact.phone || contact.name // name for widget-web

        const clientContext= await getClientContext(clientId, phone)   
        const system= client.prompt + "\n" + clientContext

        console.log("messages.count: " + messagesFromDb.length)
        console.log("systemMessage: " + system)
        
        const tools= await getAllClientTools(client.id)
        
        const result = await generateText({        
            model: myProvider.languageModel("gpt-4.1"),
            temperature: 0,
            maxSteps: 10,
            system,
            messages: uiMessages,
            tools,
        });

        const usage= result.usage
        const messages= result.response.messages

        console.log("--------------------------------")
        console.log("usage: " + JSON.stringify(usage))
        console.log("messages: " + JSON.stringify(messages, null, 3))

        const [, assistantMessage] = appendResponseMessages({
            messages: [userMessage],
            responseMessages: messages,
        });

        const promptTokens= usage.promptTokens
        const completionTokens= usage.completionTokens

        const created= await saveMessage(
            {
                conversationId,
                role: assistantMessage.role,
                content: assistantMessage.content,
                parts: assistantMessage.parts || [],
                attachments: assistantMessage.experimental_attachments || [],
                promptTokens,
                completionTokens
            },
        );

        const lastMessageWasAudio= conversation.lastMessageWasAudio
        if (lastMessageWasAudio && client.haveAudioResponse) {
          const audioBase64 = await generateAudioFromElevenLabs(created.content, "KXQbcKbroGSUf9Q5Crjd")
          await sendAudioToConversation(parseInt(chatwootAccountId), conversation.chatwootConversationId, audioBase64, true)
        } else {
          console.log("sending text to conversation, chatwootAccountId: " + chatwootAccountId + ", conversation.chatwootConversationId: " + conversation.chatwootConversationId)
          await sendTextToConversation(parseInt(chatwootAccountId), conversation.chatwootConversationId, created.content, true)
        }
  

        return true
    } catch (error) {
        console.error("Error al procesar mensaje con IA:", error);
        await sendTextToConversation(parseInt(chatwootAccountId), conversation.chatwootConversationId, "Hubo un error al procesar tu mensaje", true)
        return false
    }

}

export async function getIncomingMessageStatus(messageId: string): Promise<IncomingMessageStatus> {
    const conversationId= await getConversationIdByMessageId(messageId)
    if (!conversationId) {
        return IncomingMessageStatus.ERROR
    }


    let messageArrivedDelay= await getMessageArrivedDelay()

    const maxRetries= 10
    let retries= 0
    let isReady= false
    while (!isReady) {
        const lastMessage= await getLastMessage(conversationId)
        if (!lastMessage) {
            return IncomingMessageStatus.ERROR
        }    
        if (lastMessage.id !== messageId) {
            return IncomingMessageStatus.SKIPPED
        }
        isReady= isMessageReadyToProcess(lastMessage.createdAt, messageArrivedDelay)
        if (!isReady) {
            await new Promise(r => setTimeout(r, 1000))
            const phone= lastMessage.conversation.phone
            console.log(`sleeping 1 second for phone ${phone}`)    
        }

        retries++
        if (retries > maxRetries) {
            return IncomingMessageStatus.ERROR
        }
    }
    return IncomingMessageStatus.READY
}
function isMessageReadyToProcess(lastMessageCreatedAt: Date, messageArrivedDelayInSeconds: number) {
    const now= new Date()
    const lastMessageDate= new Date(lastMessageCreatedAt)
    const diff= now.getTime() - lastMessageDate.getTime()
    return diff > messageArrivedDelayInSeconds * 1000
}

async function getActiveConversationId(phone: string, chatwootContactId: number, clientId: string, chatwootConversationId: number) {
    const activeConversation= await getActiveConversation(phone, clientId)
    if (activeConversation) {
      return activeConversation.id
    }
    // for use with chatwoot:
    let contact= await getContactByChatwootId(String(chatwootContactId), clientId)
    if (!contact) {
        // sleep 3 seconds
        console.log("contact not found, sleeping 3 seconds")
        await new Promise(resolve => setTimeout(resolve, 3000));
        contact= await getContactByChatwootId(String(chatwootContactId), clientId)
    }

    if (!contact) {
        console.log("contact not found, sleeping 3 seconds")
        throw new Error("contact not found, chatwootContactId: " + chatwootContactId)
    }
  
    const created= await createConversation(phone, clientId, contact.id, chatwootConversationId)
    return created.id
  }
  
/**
 * Convierte un mensaje de Chatwoot en un formato adecuado para el AI SDK
 * 
 * @param message Mensaje recibido de Chatwoot
 * @returns Array de partes de mensaje en formato AI SDK
 */
async function convertChatwootMessageToParts(message: IncomingChatwootMessage, conversationId: string): Promise<Array<TextUIPart | FileUIPart>> {
    const parts: Array<TextUIPart | FileUIPart> = [];
    
    // Agregar texto si existe
    if (message.content) {
        const textPart: TextUIPart = {
            type: 'text',
            text: message.content
        };
        parts.push(textPart);
    }

    let lastMessageWasAudio= false

    // Agregar adjuntos si existen
    if (message.attachments && message.attachments.length > 0) {
        for (const attachment of message.attachments) {
            if (attachment.file_type === 'image') {
                const filePart: FileUIPart = {
                    type: 'file',
                    mimeType: 'image/jpeg',
                    data: attachment.data_url
                };
                parts.push(filePart);
            }
            if (attachment.file_type === 'audio') {
                const audioUrl= attachment.data_url
                if (audioUrl) {
                    const transcription= await transcribeAudio(audioUrl)
                    console.log("transcription:", transcription)
                    lastMessageWasAudio= true
                    const textPart: TextUIPart= {
                        type: "text",
                        text: transcription
                    }
                    parts.push(textPart)
                }
            }
            // Podríamos manejar otros tipos como video, documentos, etc. si es necesario
        }
    }

    console.log("setting lastMessageWasAudio to ", lastMessageWasAudio)
    await setLastMessageWasAudio(conversationId, lastMessageWasAudio)
    
    return parts;
}

/**
 * Convierte adjuntos de Chatwoot al formato esperado por el sistema
 * 
 * @param attachments Adjuntos recibidos desde Chatwoot
 * @returns Adjuntos en el formato compatible con el simulador
 */
function convertChatwootAttachments(attachments?: ChatwootAttachment[]): Attachment[] {
    if (!attachments || attachments.length === 0) {
        return [];
    }

    // filter attachments to discard audio
    attachments= attachments.filter(attachment => attachment.file_type !== 'audio')

    return attachments.map(attachment => {
        // Extraer el nombre del archivo de la URL
        const url = attachment.data_url;
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        // Para el contentType, usamos un valor basado en el tipo de archivo
        const contentType = attachment.file_type === 'image' ? 'image/jpeg' : 
                         attachment.file_type === 'audio' ? 'audio/ogg' : 
                         'application/octet-stream';
        
        return {
            url: url,
            name: fileName,
            contentType: contentType
        };
    });
}


async function getLastMessage(conversationId: string) {
    const message= await prisma.message.findFirst({
        where: {
            conversationId: conversationId
        },
        orderBy: {
            createdAt: 'desc'
        },
        select: {
            id: true,
            createdAt: true,
            conversation: {
                select: {
                    id: true,
                    phone: true
                }
            }
        }
    })
    return message
}

async function getConversationIdByMessageId(messageId: string) {
    const message= await prisma.message.findUnique({
        where: {
            id: messageId
        },
        select: {
            conversation: {
                select: {
                    id: true
                }
            }
        }
    })
    return message?.conversation.id
}

async function getMessageArrivedDelay() {
    let messageArrivedDelay= 5
    const MESSAGE_ARRIVED_DELAY= await getValue("MESSAGE_ARRIVED_DELAY")
    if (MESSAGE_ARRIVED_DELAY) {
        messageArrivedDelay= parseInt(MESSAGE_ARRIVED_DELAY)
    } else {
        console.log("MESSAGE_ARRIVED_DELAY not found, defaulting to 5 seconds")
    }
    return messageArrivedDelay
}

export function convertToUIMessages(messages: Array<Message>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: message.content,
      createdAt: message.createdAt,
      experimental_attachments: (message.attachments as unknown as Array<Attachment>) ?? [],
      gptData: message.gptData
    }));
}

export async function getConversationMessages(conversationId: string, take = 20) {
    const messages= await prisma.message.findMany({
        where: {
            conversationId: conversationId,
            role: {
                not: "system"
            }
        },
        orderBy: {
            createdAt: 'asc'
        },
        take: take
    })
    return messages
}

async function getConversationWithContact(conversationId: string) {
    const conversation= await prisma.conversation.findUnique({
        where: {
            id: conversationId
        },
        include: {
            contact: true
        }
    })
    return conversation
}

/**
 * Obtiene conversaciones paginadas para un cliente específico
 * 
 * @param clientId ID del cliente
 * @param page Número de página (comienza en 1)
 * @param pageSize Tamaño de página
 * @returns Conversaciones paginadas y metadatos
 */
export async function getPaginatedConversations(clientId: string, page: number = 1, pageSize: number = 10, searchQuery?: string) {
    const skip = (page - 1) * pageSize;
    
    // Construir el filtro de búsqueda
    let where: any = { clientId };
    if (searchQuery && searchQuery.trim() !== "") {
        where = {
            ...where,
            OR: [
                { phone: { contains: searchQuery, mode: "insensitive" } },
                { contact: { name: { contains: searchQuery, mode: "insensitive" } } }
            ]
        };
    }
    
    try {
        // Obtener total de conversaciones para el cliente (con filtro de búsqueda)
        const totalCount = await prisma.conversation.count({
            where
        });
        
        console.log(`Conversaciones totales para cliente ${clientId}: ${totalCount}`);
        
        // Si no hay conversaciones, devolver vacío
        if (totalCount === 0) {
            return {
                data: [],
                meta: {
                    currentPage: page,
                    pageSize,
                    totalCount: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false
                }
            };
        }
        
        // Obtener conversaciones con información relevante, sin incluir los mensajes
        const conversations = await prisma.conversation.findMany({
            where,
            select: {
                id: true,
                phone: true,
                createdAt: true,
                updatedAt: true,
                contact: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        imageUrl: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            skip,
            take: pageSize
        });
        
        console.log(`Conversaciones obtenidas: ${conversations.length}`);
        
        // Calcular metadatos de paginación
        const totalPages = Math.ceil(totalCount / pageSize);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;
        
        console.log(`Metadatos de paginación: total=${totalCount}, páginas=${totalPages}, página actual=${page}`);
        
        return {
            data: conversations,
            meta: {
                currentPage: page,
                pageSize,
                totalCount,
                totalPages,
                hasNextPage,
                hasPreviousPage
            }
        };
    } catch (error) {
        console.error("Error obteniendo conversaciones paginadas:", error);
        // En caso de error, devolver valores por defecto
        return {
            data: [],
            meta: {
                currentPage: page,
                pageSize,
                totalCount: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false
            }
        };
    }
}

export async function getClientContext(clientId: string, phone: string) {

    const timezone = "America/Montevideo";
    const now = new Date();
    const zonedDate = toZonedTime(now, timezone);
    const hoy = format(zonedDate, "EEEE, dd/MM/yyyy HH:mm:ss", {
      locale: es,
    });
  
    let contextString= "\n"
    contextString+= "<Contexto técnico>\n"
    contextString+= "Hablas correctamente el español, incluyendo el uso adecuado de tildes y eñes.\nPor favor, utiliza solo caracteres compatibles con UTF-8\n"
    contextString+= `Hoy es ${hoy} en Montevideo\n`
  
  
    const conversation= await getActiveConversation(phone, clientId)
    let contact= conversation?.contact
    let clientHaveCRM= false
    if (conversation) {
      clientHaveCRM= conversation.client.haveCRM
      contextString+= "conversationId para invocar funciones: " + conversation.id + "\n"
    } else {
      console.log("No hay conversación activa");
      contact= await getContactByPhone(phone, clientId)
      clientHaveCRM= await getClientHaveCRM(clientId)
    }
    contextString+= "</Contexto técnico>\n"
  
  
  
    if (contact && clientHaveCRM) {
      contextString+= "\n"
      contextString+= "En la siguiente sección se encuentra información del Contacto asociado al usuario de esta conversación.\n"
      contextString+= "<Información del Contacto>\n"
      contextString+= `contactId: ${contact.id}\n`
      contextString+= `Nombre: ${contact.name}\n`
      contextString+= `Teléfono: ${contact.phone}\n`
      contextString+= `Estado CRM: ${contact.stage?.name}\n`
      contextString+= `Etiquetas: ${contact.tags}\n`
  
      const customFields= await getClientCustomFields(clientId)
      const customFieldsValues= await getFieldValuesByContactId(contact.id)
      const customFieldsToShow= customFields.filter(field => field.showInContext)
      customFieldsToShow.map((field) => {
        const value= customFieldsValues.find(fieldValue => fieldValue.customFieldId === field.id)?.value
        if (value) {
          contextString+= `${field.name}: ${value}\n`
        }
      })
      contextString+= "</Información del Contacto>\n"
    } else {
      console.log("no hay contacto o cliente tiene CRM")    
    }
  
  
    const documents= await getDocumentsDAOByClient(clientId)
    if (documents.length > 0) {
        contextString+= "En la siguiente sección se encuentran documentos que pueden ser relevantes para elaborar una respuesta.\n"
        contextString+= "Los documentos se deben obtener con la función getDocument.\n"
        contextString+= "Si te preguntan algo que puede estar en alguno de los documentos debes obtener la información para elaborar la respuesta.\n"
        contextString+= "<Documentos>\n"
        documents.map((doc) => {
        contextString += `{
docId: "${doc.id}",
docName: "${doc.name}",
docDescription: "${doc.description}"
},
`
        })
        contextString+= "</Documentos>\n"
  
    }
  
    // info de eventos y disponibilidad si tiene la función obtenerDisponibilidad
  
    const clientHaveReservas= false
    if (clientHaveReservas) {
      const askInSequenceText= `Para este evento, los campos de la metadata se deben preguntar en secuencia. Esperar la respuesta de cada campo antes de preguntar el siguiente campo.\n`
      const repetitiveEvents= await getActiveEventsDAOByClientId(clientId, EventType.SINGLE_SLOT)
      const availableRepetitiveEvents= repetitiveEvents.filter(event => event.availability.length > 0)
      console.log("availableRepetitiveEvents: ", availableRepetitiveEvents.map((event) => event.name))
  
      contextString+= "<Eventos>\n"
  
      if (availableRepetitiveEvents.length > 0) {
  
        contextString+= "En la siguiente sección se encuentran eventos repetitivos disponibles para reservar.\n" 
        contextString+= "Estos tienen disponibilidad para reservar en diferentes slots de tiempo.\n" 
        contextString+= "Se debe utilizar la función obtenerDisponibilidad para obtener la disponibilidad de un evento en una determinada fecha.\n"
        contextString+= "<Eventos Repetitivos>\n"
        availableRepetitiveEvents.map((event) => {
        contextString += `{
        eventId: "${event.id}",
        eventName: "${event.name}",
        eventDescription: "${event.description}",
        eventAddress: "${event.address}",
        timezone: "${event.timezone}",
        duration: ${event.minDuration},
        metadata: ${event.metadata}\n`
  
        // eventSeatsPerTimeSlot: ${event.seatsPerTimeSlot}
  
        if (event.askInSequence) {
          contextString+= askInSequenceText
        }
  
        const hoy = format(toZonedTime(new Date(), event.timezone), "EEEE, PPP HH:mm:ss", {
          locale: es,
        })
        contextString+= `Ahora es ${hoy} en el timezone del evento (${event.timezone})\n`
        contextString+= `}\n`  
        })
        contextString+= "</Eventos Repetitivos>\n"
      } else {
        contextString+= "No hay eventos repetitivos disponibles para reservar.\n"
      }
  
      const allFixedDateEvents= await getActiveEventsDAOByClientId(clientId, EventType.FIXED_DATE)
      const fixedDateEvents= allFixedDateEvents.filter(event => event.startDateTime && event.endDateTime)
  
      if (fixedDateEvents.length > 0) {
        contextString+= "En la siguiente sección se encuentran eventos de tipo única vez (fecha fija) que pueden ser relevantes para elaborar una respuesta.\n"
        contextString+= "Estos eventos tienen la disponibilidad (cupos) entre los datos del evento. No se debe utilizar la función obtenerDisponibilidad ya que la fecha del evento es fija.\n"
        contextString+= "<Eventos de tipo Única vez>\n"
        fixedDateEvents.map((event) => {
        contextString += `{
  eventId: "${event.id}",
  eventName: "${event.name}",
  eventDescription: "${event.description}",
  eventAddress: "${event.address}",
  timezone: "${event.timezone}",
  seatsAvailable: ${event.seatsAvailable},
  seatsTotal: ${event.seatsPerTimeSlot},
  startDateTime: "${format(toZonedTime(event.startDateTime!, event.timezone), "dd/MM/yyyy HH:mm")}",
  endDateTime: "${format(toZonedTime(event.endDateTime!, event.timezone), "dd/MM/yyyy HH:mm")}",
  metadata: ${event.metadata}\n`
  
        if (event.askInSequence) {
          contextString+= askInSequenceText
        }
        const hoy = format(toZonedTime(new Date(), event.timezone), "EEEE, dd/MM/yyyy HH:mm:ss", {
          locale: es,
        })
    
        contextString+= `Ahora es ${hoy} en el timezone del evento (${event.timezone})\n`
        contextString+= `}\n`  
        })        
        contextString+= "</Eventos de tipo Única vez>\n"
      } else {
        contextString+= "No hay eventos de tipo Única vez disponibles para reservar.\n"
      }
      
      contextString+= "</Eventos>\n"
  
      // info de las reservas
      contextString+= "En la siguiente sección se encuentran las reservas activas del contacto.\n"
      contextString+= "<Reservas>\n"
      const bookings= await getFutureBookingsDAOByPhone(phone, clientId)
      if (bookings.length > 0) {
        bookings.map((booking) => {
          contextString+= `{
            event: "${booking.eventName}",
            bookingId: "${booking.id}",
            bookingName: "${booking.name}",
            bookingSeats: ${booking.seats},
            bookingStatus: "${booking.status}",
            bookingDate: "${format(booking.start, "dd/MM/yyyy HH:mm")}"
          }\n`
        })
      } else {
        contextString+= "Este contacto no tiene reservas activas.\n"
      }
  
      contextString+= "</Reservas>\n"
  
    }
  
    return contextString
}