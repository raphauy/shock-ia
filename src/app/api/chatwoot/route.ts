import { sendTextToConversation } from "@/services/chatwoot";
import { getClient, getClientIdByChatwootAccountId } from "@/services/clientService";
import { MessageDelayResponse, onMessageReceived, processDelayedMessage } from "@/services/messageDelayService";
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
        const content= json.content
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

        //if ((inboxName === "cantinabarreiro" || inboxName === "dev-cantinabarreiro") && (senderPhone !== "+59892265737" && senderPhone !== "+59899565515" && senderPhone !== "+59894197353")) {
        if ((inboxName === "cantinabarreiro" || inboxName === "dev-cantinabarreiro") && (senderPhone !== "+59892265737")) {
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


        if (contentType !== "text" || !content) {
            console.log("error: ", "contentType is not text or content is empty")
            await sendTextToConversation(parseInt(accountId), conversationId, "Por el momento no podemos procesar mensajes que no sean de texto.")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }

        let phone= json.sender.phone_number
        if (!phone) {
            phone= json.sender.name
        }

        const delayResponse: MessageDelayResponse= await onMessageReceived(phone, content, clientId, "user", "", undefined, undefined, conversationId, senderId)
        
        if (delayResponse.wasCreated ) {
            if (delayResponse.message) {
                waitUntil(processDelayedMessage(delayResponse.message.id, phone))
                
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

export async function GET(request: Request, { params }: { params: { clientId: string } }) {

    const res= "API is working"


    return NextResponse.json( { "data": res }, { status: 200 })

}


function processConnectionUpdate(json: any) {
    console.log("processing connection update")
    console.log("json: ", json)
}