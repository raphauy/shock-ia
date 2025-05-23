import { sendTextToConversation } from "@/services/chatwoot";
import { checkWorkingHoursNow, getClient, getClientIdByChatwootAccountId } from "@/services/clientService";
import { getContactByPhone } from "@/services/contact-services";
import { setLastMessageWasAudio } from "@/services/conversationService";
import { MessageDelayResponse, onMessageReceived, processDelayedMessage } from "@/services/messageDelayService";
import { transcribeAudio } from "@/services/transcribe-services";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

export const maxDuration = 299

export async function POST(request: Request) {

    try {
        const json= await request.json()
        if (!json.account || !json.conversation) {
            console.log("error: ", "account or conversation is missing")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }
        const accountId= json.account.id
        const conversationId= json.conversation.id
        const contentType= json.content_type
        let content= json.content
        const messageType= json.message_type
        const inboxName= json.inbox.name
        const conversationStatus= json.conversation.status
        const senderId= json.sender.id
        console.log("accountId: ", accountId)
        console.log("conversationId: ", conversationId)
        console.log("contentType: ", contentType)
        console.log("content: ", content)
        console.log("messageType: ", messageType)
        console.log("inboxName: ", inboxName)
        console.log("conversationStatus: ", conversationStatus)
        console.log("senderId: ", senderId)

        if (conversationStatus !== "pending") {
            console.log("skipping message because conversationStatus is not pending: ", conversationStatus)
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }


        if (!accountId || !conversationId || !contentType) {
            console.log("error: ", "accountId, conversationId or contentType is missing")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }

        if (messageType !== "incoming") {
            console.log("messageType is not incoming: ", messageType)
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }
        //console.log("general api json: ", json)

        const senderName= json.sender.name
        const senderPhone= json.sender.phone_number
        if (senderName === "EvolutionAPI" || senderPhone === "+123456") {
            console.log("connection API message, not processed")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }

        if ((accountId === 16 || accountId === 1) && (senderPhone !== "+59892265737" && senderPhone !== "+59892045358")) {
            console.log("phone is not allowed for this account")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }

        const clientId= await getClientIdByChatwootAccountId(String(accountId))
        if (!clientId) {
            console.log("error: ", "clientId not found")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }

        const client= await getClient(clientId)
        if (!client) {
            console.log("error: ", "client not found")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }
        const inboxProvider= client?.inboxProvider
        if (inboxProvider !== "CHATWOOT") {
            console.log("inboxProvider for " + client?.name + " is not CHATWOOT")
            return NextResponse.json({ message: "inboxProvider for " + client?.name + " is not CHATWOOT" }, { status: 200 })
        }

        let lastMessageWasAudio= false

        if (contentType !== "text" || !content) {
            const audioUrl= json.attachments[0].data_url
            console.log("audioUrl:", audioUrl)
            if (audioUrl) {
                const transcription= await transcribeAudio(audioUrl)
                console.log("transcription:", transcription)
                lastMessageWasAudio= true
                content= transcription
            } else {
    
                console.log("error: ", "contentType is not text or content is empty")            
                const contact= await getContactByPhone(senderPhone, clientId)
                if (contact && contact.stage?.isBotEnabled) {
                    await sendTextToConversation(parseInt(accountId), conversationId, "Por el momento no podemos procesar mensajes que no sean de texto.")
                } else {
                    console.log("contact not found or bot is not enabled")
                }
                return NextResponse.json({ data: "ACK" }, { status: 200 })
            }
        }

        let phone= json.sender.phone_number
        if (!phone) {
            phone= json.sender.name
        }

        const delayResponse: MessageDelayResponse= await onMessageReceived(phone, content, clientId, "user", "", undefined, undefined, conversationId, senderId)
        const dbConversationId= delayResponse.message?.conversationId
        if (dbConversationId) {
            console.log("setting lastMessageWasAudio to ", lastMessageWasAudio)
            await setLastMessageWasAudio(dbConversationId, lastMessageWasAudio)
        } else {
            console.log("dbConversationId not found")
        }
        
        if (delayResponse.wasCreated ) {
            if (delayResponse.message) {
                const isWorkingHourNow= await checkWorkingHoursNow(clientId)
                if (isWorkingHourNow) {
                    waitUntil(processDelayedMessage(delayResponse.message.id, phone))
                } else {
                    console.log("client is not working hour now")
                }
                
            } else {
                console.log("delayResponse.message wasCreated but is null")
                return NextResponse.json({ error: "there was an error processing the message" }, { status: 502 })
            }
        } else {
            console.log(`message from ${phone} was updated, not processed`)
        }        

    
        return NextResponse.json({ data: "ACK" }, { status: 200 })
    
    } catch (error) {
        console.log("error: ", error)
        return NextResponse.json({ error: "error: " + error}, { status: 502 })                
    }

}

export async function GET(request: Request) {

    const res= "API is working"


    return NextResponse.json( { "data": res }, { status: 200 })

}


function processConnectionUpdate(json: any) {
    console.log("processing connection update")
    console.log("json: ", json)
}

