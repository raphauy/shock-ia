import { getClient } from "@/services/clientService";
import { MessageDelayResponse, onMessageReceived, processDelayedMessage } from "@/services/messageDelayService";
import { log } from "console";
import { NextResponse } from "next/server";


export const maxDuration = 299

type Props= {
    params: Promise<{
        clientId: string
    }>
}

export async function POST(request: Request, props: Props) {
    const params = await props.params;

    try {
        const clientId = params.clientId
        if (!clientId) return NextResponse.json({ error: "clientId not found, probably wrong url" }, { status: 400 })
        
        const client= await getClient(clientId)
        const inboxProvider= client?.inboxProvider
        if (inboxProvider !== "WRC") {
            return NextResponse.json({ message: "inboxProvider for " + client?.name + " is not WRC" }, { status: 200 })
        }
    

        const json= await request.json()
        console.log("json: ", json)
        const event= json.event
        console.log("event: ", event)
        if (event === "connection.update") {
            processConnectionUpdate(json)
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }
        const instanceName= json.instance
        console.log("instanceName: ", instanceName)
        const fromMe= json.data.key.fromMe
        console.log("fromMe: ", fromMe)
        const phone= json.data.key.remoteJid.split("@")[0]
        const pushName= json.data.pushName
        console.log("pushName: ", pushName)
        const text= json.data.message.conversation
        const messageType= json.data.messageType
        console.log("messageType: ", messageType)
        if (messageType !== "conversation" && messageType !== "extendedTextMessage") {
            log("messageType is not conversation")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }
        const dateTimestamp= new Date(json.data.messageTimestamp * 1000)
        const zonedDateTimestamp= dateTimestamp.toLocaleString('es-UY', { timeZone: 'America/Montevideo' })
        console.log("zonedDateTimestamp: ", zonedDateTimestamp)
    
        if (!phone) {
            return NextResponse.json({ error: "phone is required" }, { status: 400 })
        }
    
        if (!text) {
            return NextResponse.json({ error: "text is required" }, { status: 400 })
        }
    
        console.log("phone: ", phone)
        console.log("text: ", text)
        if (instanceName === "cantinabarreiro" && phone !== "59892265737") {
            console.log("phone is not allowed for this instance")
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }
    
        const delayResponse: MessageDelayResponse= await onMessageReceived(phone, text, clientId, "user", "")
        console.log(`delayResponse wasCreated: ${delayResponse.wasCreated}`)
        console.log(`delayResponse message: ${delayResponse.message ? delayResponse.message.id : "null"}`)
    
        if (delayResponse.wasCreated ) {
            if (delayResponse.message) {
                await processDelayedMessage(delayResponse.message.id, phone)                
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