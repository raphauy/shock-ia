import { MessageDelayResponse, onMessageReceived, processDelayedMessage } from "@/services/messageDelayService";
import { NextResponse } from "next/server";

export const maxDuration = 59
// export const dynamic = 'force-dynamic'


export async function POST(request: Request, { params }: { params: { clientId: string } }) {

    try {
        const authorization = request.headers.get("authorization")
        if (!authorization) return NextResponse.json({ error: "authorization is required" }, { status: 400 })
        const apiToken= authorization.replace("Bearer ", "")
        if (!apiToken) return NextResponse.json({ error: "apiToken is required" }, { status: 400 })
        if (apiToken !== process.env.API_TOKEN) return NextResponse.json({ error: "Bad apiToken" }, { status: 400 })
        
        const clientId = params.clientId
        if (!clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 })

        const json= await request.json()
        const message= json.message
        console.log("json: ", json)
        console.log("message: ", message)

        const phone = message.phone
        if (!phone) {
            return NextResponse.json({ error: "phone is required" }, { status: 400 })
        }

        const text = message.text
        if (!text) {
            return NextResponse.json({ error: "text is required" }, { status: 400 })
        }

        console.log("phone: ", phone)
        console.log("text: ", text)

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
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}

