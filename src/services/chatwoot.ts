import axios from 'axios'
import ChatwootClient, { agent } from "@figuro/chatwoot-sdk"
import { getChatwootAccountId, getClient } from "./clientService"


export async function sendTextToConversation(accountId: number, conversationId: number, message: string) {
    const chatwootUrl= process.env.CHATWOOT_URL!
    const chatwootToken= process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN!
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

export async function sendAudioToConversation(accountId: number, conversationId: number, audioBase64: string) {
    const chatwootUrl= process.env.CHATWOOT_URL!
    const chatwootToken= process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN!
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
//    const chatwootToken= process.env.CHATWOOT_ACCESS_TOKEN!
    const chatwootToken = process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN!
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

async function getChatwootClient(token: string | undefined) {
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
    const chatwootToken= process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN!
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
    const chatwootUrl = process.env.CHATWOOT_URL!
    const chatwootToken = process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN!
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