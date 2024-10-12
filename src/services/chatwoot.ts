import axios from 'axios'
import ChatwootClient from "@figuro/chatwoot-sdk"
import { getChatwootAccountId, getClient } from "./clientService"


export async function sendTextToConversation(accountId: number, conversationId: number, message: string) {
    const chatwootUrl= process.env.CHATWOOT_URL!
    const chatwootToken= process.env.CHATWOOT_AGENT_BOT_ACCESS_TOKEN!
    console.log("chatwootUrl:", chatwootUrl)
    console.log("chatwootToken:", chatwootToken)
    if (!chatwootUrl || !chatwootToken) {
        console.error("CHATWOOT_URL or CHATWOOT_TOKEN is not set")
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

    client.messages.create({
        accountId: accountId,
        conversationId: conversationId,
        data: {
            content: message
        }
    })
}

export async function addLabelToConversation(accountId: number, phone: string, tagName: string) {
    const chatwootUrl= process.env.CHATWOOT_URL!
    const chatwootToken= process.env.CHATWOOT_ACCESS_TOKEN!
    console.log("chatwootUrl:", chatwootUrl)
    console.log("chatwootToken:", chatwootToken)
    if (!chatwootUrl || !chatwootToken) {
        console.error("CHATWOOT_URL or CHATWOOT_TOKEN is not set")
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
                labels: [tagName]
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