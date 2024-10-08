import ChatwootClient from "@figuro/chatwoot-sdk"

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