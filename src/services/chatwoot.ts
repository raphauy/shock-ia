import axios from 'axios'
import ChatwootClient, { agent } from "@figuro/chatwoot-sdk"
import { getChatwootAccountId, getClient, getClientIdByChatwootAccountId } from "./clientService"
import { getV2EnabledByChatwootAccountId } from './conversation-v2-services'


export async function sendTextToConversation(accountId: number, conversationId: number, message: string, V2: boolean = false) {
    if (!V2) {
        V2= await getV2EnabledByChatwootAccountId(accountId) || false
    }
    const chatwootUrl= process.env.CHATWOOT_URL!
    const chatwootToken= V2 ? process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN_V2 : process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN!
    console.log("chatwootUrl:", chatwootUrl)
    if (!chatwootUrl || !chatwootToken) {
        console.error("CHATWOOT_URL or CHATWOOT_AGENT_BOT_ACCESS_TOKEN is not set")
        return
    }

    const client = new ChatwootClient({
        config: {
            basePath: chatwootUrl,
            with_credentials: true,
            credentials: "include",
            token: chatwootToken
        }
    });

    await client.messages.create({
        accountId: accountId,
        conversationId: conversationId,
        data: {
            content: message
        }
    })
}

export async function sendAudioToConversation(accountId: number, conversationId: number, audioBase64: string, V2: boolean = false) {
    const chatwootUrl= process.env.CHATWOOT_URL!
    const chatwootToken= V2 ? process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN_V2 : process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN!
    console.log("chatwootUrl:", chatwootUrl)
    if (!chatwootUrl || !chatwootToken) {
        console.error("CHATWOOT_URL or CHATWOOT_AGENT_BOT_ACCESS_TOKEN is not set")
        return
    }

    const client = new ChatwootClient({
        config: {
            basePath: chatwootUrl,
            with_credentials: true,
            credentials: "include",
            token: chatwootToken
        }
    })

    const response= await client.messages.create({
        accountId: accountId,
        conversationId: conversationId,        
        data: {
            content: "Mensaje de audio",
            attachments: [
                {
                    content: audioBase64,
                    encoding: "base64",
                    filename: "audio.mp3",
                }
            ]
        }
    })

    return response
}

export async function addLabelToConversation(accountId: number, conversationId: number, labels: string[]) {
    const chatwootUrl= process.env.CHATWOOT_URL!
    const chatwootToken= process.env.CHATWOOT_ACCESS_TOKEN!
    console.log("chatwootUrl:", chatwootUrl)
    if (!chatwootUrl || !chatwootToken) {
        console.error("CHATWOOT_URL or CHATWOOT_ACCESS_TOKEN is not set")
        return
    }

    const client = new ChatwootClient({
        config: {
            basePath: chatwootUrl,
            with_credentials: true,
            credentials: "include",
            token: chatwootToken
        }
    });

    console.log("labels:", labels)

    const addTagResponse = await client.conversationLabels.add({
        accountId,
        conversationId,
        data: {
            labels: labels
        }
    })
    
    console.log("Etiqueta añadida:", addTagResponse)
}

export async function addLabelToConversationByPhone(accountId: number, phone: string, labels: string[]) {
    const chatwootUrl= process.env.CHATWOOT_URL!
    const V2= await getV2EnabledByChatwootAccountId(accountId) || false
    const chatwootToken = V2 ? process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN_V2 : process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN!
    console.log("chatwootUrl:", chatwootUrl)
    console.log("chatwootToken:", chatwootToken)
    if (!chatwootUrl || !chatwootToken) {
        console.error("CHATWOOT_URL or CHATWOOT_AGENT_BOT_ACCESS_TOKEN is not set")
        return
    }

    const client = new ChatwootClient({
        config: {
            basePath: chatwootUrl,
            with_credentials: true,
            credentials: "include",
            token: chatwootToken
        }
    });

    const contacts = await client.contacts.search({
        accountId: accountId,
        q: phone
    })

    const contactId = contacts.payload?.[0]?.id
    console.log("contactId:", contactId)
    if (!contactId) {
        console.error("Contact ID not found for phone number:", phone)
        return
    }

    const conversations = await client.contacts.listConversations({
        accountId: accountId,
        id: contactId
    })

    //console.log("conversations:", conversations)

    // @ts-ignore
    const conversationId = conversations.payload[0]?.id
    console.log("conversationId:", conversationId)

        const addTagResponse = await client.conversationLabels.add({
            accountId: accountId,
            conversationId: conversationId,
            data: {
                labels: labels
            }
        })
    
    console.log("Etiqueta añadida:", addTagResponse)



}

export async function createAgentBotToClient(clientId: string) {
    const client = await getClient(clientId)
    if (!client) {
        console.error("Client not found")
        return
    }

    const chatwootAccountId = await getChatwootAccountId(client.id)
    if (!chatwootAccountId) {
        console.error("Chatwoot account ID not found")
        return
    }

    const chatwootUrl = process.env.CHATWOOT_URL!
    const chatwootToken = process.env.CHATWOOT_PLATFORM_APP_API_KEY!
    console.log("chatwootToken:", chatwootToken)
    const baseUrl = process.env.NEXTAUTH_URL


    if (!chatwootUrl || !chatwootToken) {
        console.error("CHATWOOT_URL or CHATWOOT_PLATFORM_APP_API_KEY is not set")
        return
    }

    try {
        const response = await axios.post(`${chatwootUrl}/platform/api/v1/agent_bots`,
            {
                name: `${client.name} Bot`,
                description: `Bot for ${client.name}`,
                account_id: chatwootAccountId,
                outgoing_url: `${baseUrl}/api/chatwoot`
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': chatwootToken
                }
            }
        )

        console.log('Agent bot created successfully:', response.data)
    } catch (error: unknown) {
        console.error('Error creating agent bot:', error)
        if (error instanceof Error) {
            console.error('Error creating agent bot:', error.message);
        } else if (axios.isAxiosError(error) && error.response) {
            console.error('Error creating agent bot:', error.response.data);
        } else {
            console.error('Error creating agent bot:', String(error));
        }
    }
}

export async function removeAgentBotFromClient(botId: string) {

    const chatwootUrl = process.env.CHATWOOT_URL!
    const chatwootToken = process.env.CHATWOOT_PLATFORM_APP_API_KEY!
    console.log("chatwootUrl:", chatwootUrl)
    console.log("chatwootToken:", chatwootToken)
    if (!chatwootUrl || !chatwootToken) {
        console.error("CHATWOOT_URL or CHATWOOT_ACCESS_TOKEN is not set")
        return
    }

    try {
        const response = await axios.delete(`${chatwootUrl}/platform/api/v1/agent_bots/${botId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': chatwootToken
                }
            }
        )
        console.log('Agent bot removed successfully:', response.data)
    } catch (error: unknown) {
        console.error('Error removing agent bot:', error)
    }
}


function getChatwootConfig(chatwootToken: string | undefined) {
    if (!chatwootToken) {
        console.error("CHATWOOT_ACCESS_TOKEN is not set")
        throw new Error("CHATWOOT_ACCESS_TOKEN is not set")
    }
    const chatwootUrl = process.env.CHATWOOT_URL!
    
    console.log("chatwootUrl:", chatwootUrl)
    console.log("chatwootToken:", chatwootToken)
    if (!chatwootUrl) {
        console.error("CHATWOOT_URL is not set")
        throw new Error("CHATWOOT_URL is not set")
    }

    return { chatwootUrl, chatwootToken }
}

export async function getChatwootClient(token: string | undefined) {
    if (!token) {
        console.error("CHATWOOT_ACCESS_TOKEN is not set")
        throw new Error("CHATWOOT_ACCESS_TOKEN is not set")
    }
    const chatwootUrl = process.env.CHATWOOT_URL!
    
    if (!chatwootUrl || !token) {
        console.error("CHATWOOT_URL or CHATWOOT_ACCESS_TOKEN is not set")
        throw new Error("CHATWOOT_URL or CHATWOOT_ACCESS_TOKEN is not set")
    }

    const client = new ChatwootClient({
        config: {
            basePath: chatwootUrl,
            with_credentials: true,
            credentials: "include",
            token
        }
    })
    if (!client) {
        console.error("Chatwoot client not found")
        throw new Error("Problem creating chatwoot client")
    }
    return client
}

export async function toggleConversationStatus(accountId: number, conversationId: number, status: "open" | "resolved" | "pending") {
    const chatwootUrl = process.env.CHATWOOT_URL!
    const V2= await getV2EnabledByChatwootAccountId(accountId) || false
    const chatwootToken = V2 ? process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN_V2 : process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN!
    console.log("chatwootUrl:", chatwootUrl)
    console.log("chatwootToken:", chatwootToken)
    if (!chatwootUrl || !chatwootToken) {
        console.error("CHATWOOT_URL or CHATWOOT_AGENT_BOT_ACCESS_TOKEN is not set")
        return
    }

    const client = await getChatwootClient(chatwootToken)

    await client.conversations.toggleStatus({
        accountId: accountId,
        conversationId: conversationId,
        data: {
            status: status
        }
    })

    console.log("Conversation status updated to:", status)
}

type CreateResponse= {
    id: string | null
    error: string | null
}

export async function createContactInChatwoot(accountId: number, inboxId: number, phoneNumber: string, name?: string): Promise<CreateResponse> {
    const chatwootToken = process.env.CHATWOOT_ACCESS_TOKEN!

    // identifier is the phone number without the + and concatenated with @us.whatsapp.net
    const identifier = phoneNumber.replace(/\+/g, '').replace(/\s/g, '') + '@us.whatsapp.net'

    try {
        const client = await getChatwootClient(chatwootToken)

        const contact = await client.contacts.create({
            accountId: accountId,
            data: {
                inbox_id: inboxId,
                identifier: identifier,
                phone_number: phoneNumber,
                name: name || phoneNumber,
            }
        })

        // @ts-ignore
        const id: string= contact.payload.contact.id as string
        return { id, error: null }
    } catch (error) {
        const errorStatus= (error as any).status
        console.error("error.status: ", errorStatus)
        if (errorStatus === 422) {
            return { id: null, error: "Número ya existe" }
        }
        const message= error instanceof Error ? error.message : "Error al crear contacto"
        console.error("Error creating contact:", message)
        return { id: null, error: message }
    }
}

export async function createChatwootConversation(accountId: number, inboxId: string, chatwootContactId: string) {
    const V2= await getV2EnabledByChatwootAccountId(accountId)
    const chatwootUrl = process.env.CHATWOOT_URL!
    const chatwootToken = V2 ? process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN_V2 : process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN!
    console.log("chatwootUrl:", chatwootUrl)
    console.log("chatwootToken:", chatwootToken)
    
    if (!chatwootUrl || !chatwootToken) {
        console.error("CHATWOOT_URL or CHATWOOT_AGENT_BOT_ACCESS_TOKEN is not set")
        return
    }

    const client = new ChatwootClient({
        config: {
            basePath: chatwootUrl,
            with_credentials: true,
            credentials: "include",
            token: chatwootToken
        }
    })

    try {
        const response = await client.conversations.create({
            accountId,
            data: {
                inbox_id: inboxId,
                status: "pending",                
                contact_id: chatwootContactId
            }
        })

        console.log("Conversation created with id:", response.id)
        return response.id
    } catch (error) {
        console.error("Error creating conversation:", error)
        throw error
    }
}

export async function getInboxId(accountId: number, inboxName: string) {
    const chatwootUrl = process.env.CHATWOOT_URL!
    const chatwootToken = process.env.CHATWOOT_ACCESS_TOKEN!

    const client = await getChatwootClient(chatwootToken)

    const response = await client.inboxes.list({ accountId: accountId })
    // @ts-ignore
    const inboxes = response.payload

    const inbox = inboxes.find((inbox: any) => inbox.name === inboxName)
    if (!inbox) {
        console.error("Inbox not found")
        return null
    }

    return inbox.id
}

export async function deleteContactInChatwoot(accountId: number, contactId: number) {
    const chatwootToken = process.env.CHATWOOT_ACCESS_TOKEN!
    const client = await getChatwootClient(chatwootToken)
    await client.contacts.delete({ accountId: accountId, id: contactId })
    console.log("Contact deleted in chatwoot: ", contactId)
}

export async function listAccountAgents(accountId: number) {
    const chatwootUrl= process.env.CHATWOOT_URL!
    const chatwootToken= process.env.CHATWOOT_ACCESS_TOKEN!
    console.log("chatwootUrl:", chatwootUrl)
    console.log("searching agents for accountId:", accountId)
    if (!chatwootUrl || !chatwootToken) {
        console.error("CHATWOOT_URL or CHATWOOT_ACCESS_TOKEN is not set")
        return
    }

    const client = new ChatwootClient({
        config: {
            basePath: chatwootUrl,
            with_credentials: true,
            credentials: "include",
            token: chatwootToken
        }
    });

    const agentListResponse = await client.agents.list({ accountId: accountId })
    return agentListResponse
}

export async function getChatwootUserName(accountId: number, userId: number) {
    const agentListResponse= await listAccountAgents(accountId)
    if (!agentListResponse) {
        console.error("Agent list not found")
        return null
    }
    const agent = agentListResponse.find((agent: agent) => agent.id === userId)
    return agent?.name
}

export async function assignConversationToAgent(accountId: number, conversationId: number, agentId: number) {
    const chatwootUrl= process.env.CHATWOOT_URL!
    const chatwootToken= process.env.CHATWOOT_ACCESS_TOKEN!

    const client = await getChatwootClient(chatwootToken)

    const response = await client.conversationAssignment.assign({ accountId: accountId, conversationId: conversationId, data: { assignee_id: agentId } })
    return response
}

/**
 * Busca conversaciones en estado 'open' e inactivas por más de 24 horas para un cliente dado (accountId)
 * @param accountId ID de la cuenta de Chatwoot
 * @param page Página de resultados (opcional, por defecto 1)
 * @param perPage Cantidad de resultados por página (opcional, por defecto 20)
 * @returns Lista de objetos con información de conversaciones inactivas abiertas
 */
export async function getInactiveOpenConversations(accountId: number, page: number = 1, perPage: number = 20): Promise<Array<{
    id: number;
    contactName: string;
    phoneNumber: string;
}>> {
    const chatwootUrl = process.env.CHATWOOT_URL!;
    const chatwootToken = process.env.CHATWOOT_ACCESS_TOKEN!;
    if (!chatwootUrl || !chatwootToken) {
        console.error("CHATWOOT_URL or CHATWOOT_ACCESS_TOKEN is not set");
        throw new Error("CHATWOOT_URL or CHATWOOT_ACCESS_TOKEN is not set");
    }

    const url = `${chatwootUrl}/api/v1/accounts/${accountId}/conversations/filter`;

    const payload = [
        {
            attribute_key: "status",
            filter_operator: "equal_to",
            values: ["open"],
            query_operator: "AND"
        },
        {
            attribute_key: "last_activity_at",
            filter_operator: "days_before",
            values: [1]
        }
    ];

    try {
        const response = await axios.post(url,
            { payload },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api_access_token': chatwootToken
                },
                params: {
                    page,
                    per_page: perPage
                }
            }
        );
        const conversations = response.data?.payload || [];
        const filteredConversations = conversations.filter((conv: any) => conv.meta.sender.phone_number !== "+123456");
        
        // Extraer información detallada de cada conversación
        const conversationDetails = filteredConversations.map((conv: any) => {
            return {
                id: conv.id,
                contactName: conv.meta?.sender?.name || "Sin nombre",
                phoneNumber: conv.meta?.sender?.phone_number || "Sin teléfono"
            };
        });
        
        console.log(`Se encontraron ${conversationDetails.length} conversaciones inactivas abiertas`);
        return conversationDetails;
    } catch (error) {
        console.error('Error buscando conversaciones inactivas abiertas:', error);
        throw error;
    }
}

/**
 * Busca conversaciones inactivas y abiertas y cambia su estado a 'pending'
 * @param accountId ID de la cuenta de Chatwoot
 * @returns Array de objetos con información de las conversaciones actualizadas
 */
export async function setInactiveOpenConversationsAsPending(accountId: number): Promise<Array<{
    conversationId: number;
    contactName: string;
    contactPhone: string;
}>> {
    try {
        // Obtener todas las conversaciones inactivas en estado "open"
        const inactiveConversations = await getInactiveOpenConversations(accountId);
        
        if (inactiveConversations.length === 0) {
            console.log('No se encontraron conversaciones inactivas abiertas para actualizar');
            return [];
        }
        
        console.log(`Se encontraron ${inactiveConversations.length} conversaciones inactivas abiertas para actualizar`);
        
        // Cambiar el estado de cada conversación a "pending"
        const updatedConversations: Array<{
            conversationId: number;
            contactName: string;
            contactPhone: string;
        }> = [];
        
        const chatwootUrl = process.env.CHATWOOT_URL!;
        const chatwootToken = process.env.CHATWOOT_ACCESS_TOKEN!;
        
        if (!chatwootUrl || !chatwootToken) {
            console.error("CHATWOOT_URL or CHATWOOT_ACCESS_TOKEN is not set");
            throw new Error("CHATWOOT_URL or CHATWOOT_ACCESS_TOKEN is not set");
        }
        
        const client = await getChatwootClient(chatwootToken);
        
        for (const conversation of inactiveConversations) {
            try {
                await client.conversations.toggleStatus({
                    accountId: accountId,
                    conversationId: conversation.id,
                    data: {
                        status: "pending"
                    }
                });
                
                updatedConversations.push({
                    conversationId: conversation.id,
                    contactName: conversation.contactName,
                    contactPhone: conversation.phoneNumber
                });
                
                console.log(`Conversación ${conversation.id} actualizada a estado 'pending' - Contacto: ${conversation.contactName} (${conversation.phoneNumber})`);
            } catch (error) {
                console.error(`Error al actualizar conversación ${conversation.id}:`, error);
                // Continuamos con las siguientes conversaciones a pesar del error
            }
        }
        
        console.log(`Se actualizaron ${updatedConversations.length} de ${inactiveConversations.length} conversaciones a 'pending'`);
        return updatedConversations;
    } catch (error) {
        console.error('Error al procesar conversaciones inactivas:', error);
        throw error;
    }
}