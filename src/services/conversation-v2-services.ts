// Definimos los tipos basados en la estructura real de los mensajes de Chatwoot
import { prisma } from "@/lib/db";
import { ChatwootAttachment, IncomingChatwootMessage } from "@/services/chatwoot-types";
import { getChatwootAccountId, getClient, getClientIdByChatwootAccountId } from "@/services/clientService";
import { ContactFormValues, createContact, getContactByChatwootId, getContactByPhone, getOrCreateContact } from "@/services/contact-services";
import { MessageFormValues, saveMessage, saveMessages } from "@/services/messages-service";
import { Attachment, FileUIPart, TextUIPart, UIMessage } from "@ai-sdk/ui-utils";
import { myProvider } from "@/lib/ai/providers";
import { getAllClientTools } from "@/lib/ai/tools";
import { appendResponseMessages, generateText } from "ai";
import { createConversation, getActiveConversation, getSystemMessage } from "@/services/conversationService";
import { getContext } from "@/services/function-call-services";
import { generateAudioFromElevenLabs, getFullModelDAO } from "@/services/model-services";
import { getValue } from "./config-services";
import { Message } from '@/lib/generated/prisma';
import { getMostRecentUserMessage } from "@/lib/ai/chat-utils";
import { getStageByChatwootId } from "./stage-services";
import { sendAudioToConversation, sendTextToConversation } from "./chatwoot";


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
        
        const parts = convertChatwootMessageToParts(message);
        
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
        const contextResponse= await getContext(clientId, phone, "TODO: remove this")
  
        const systemMessage= getSystemMessage(client.prompt, contextResponse.contextString)
      
        console.log("messages.count: " + messagesFromDb.length)
        console.log("messages: " + JSON.stringify(uiMessages, null, 3))
    
        const tools= await getAllClientTools(client.id)
    
        const result = await generateText({        
            model: myProvider.languageModel("gpt-4.1"),
            temperature: 0,
            maxSteps: 10,
            system: systemMessage.content,
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

        const chatwootAccountId= await getChatwootAccountId(client.id)
        if (!chatwootAccountId) throw new Error("chatwootAccountId not found")
        if (!conversation.chatwootConversationId) throw new Error("chatwootConversationId not found")
            
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
function convertChatwootMessageToParts(message: IncomingChatwootMessage): Array<TextUIPart | FileUIPart> {
    const parts: Array<TextUIPart | FileUIPart> = [];
    
    // Agregar texto si existe
    if (message.content) {
        const textPart: TextUIPart = {
            type: 'text',
            text: message.content
        };
        parts.push(textPart);
    }
    
    // Agregar adjuntos si existen
    if (message.attachments && message.attachments.length > 0) {
        for (const attachment of message.attachments) {
            if (attachment.file_type === 'image' || attachment.file_type === 'audio') {
                // Para imágenes y audios, creamos una parte de archivo
                // Nota: data debería ser el contenido en base64, pero como solo tenemos la URL,
                // tendremos que convertir los datos del archivo en una etapa posterior
                // Por ahora, solo almacenamos la URL en el campo data
                const filePart: FileUIPart = {
                    type: 'file',
                    mimeType: attachment.file_type === 'image' ? 'image/jpeg' : 'audio/ogg',
                    data: attachment.data_url
                };
                parts.push(filePart);
            }
            // Podríamos manejar otros tipos como video, documentos, etc. si es necesario
        }
    }
    
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