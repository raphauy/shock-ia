import { sendTextToConversation } from "@/services/chatwoot";
import { getClient, getClientIdByChatwootAccountId } from "@/services/clientService";
import { ContactFormValues, createContact, getContactByChatwootId, updateContact } from "@/services/contact-services";
import { MessageDelayResponse, onMessageReceived, processDelayedMessage } from "@/services/messageDelayService";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";


export const maxDuration = 299

export async function POST(request: Request) {

    try {
        const json= await request.json()
        console.log("general api json: ", json)
        const event= json.event
        console.log("event: ", event)
        const accountId= json.account.id
        console.log("accountId: ", accountId)
        const accountName= json.account.name
        console.log("accountName: ", accountName)

        const clientId= await getClientIdByChatwootAccountId(String(accountId))
        console.log("clientId: ", clientId)
        if (!clientId) throw new Error("Client not found")

        const phone= json.phone_number
        const name= json.name
        const contactValues: ContactFormValues= {
            chatwootId: String(json.id),
            name,
            phone,
            imageUrl: json.avatar,
            src: phone ? "whatsapp" : name ? "widget-web" : "other",
            clientId
        }

        if (event === "contact_created") {
            console.log("contact_created")
            await createContact(contactValues)
        } else if (event === "contact_updated") {
            const contact= await getContactByChatwootId(String(json.id))
            if (!contact) {
                console.log("contact not found on contact_updated, creating contact")
                // sleep 1 second
                await new Promise(resolve => setTimeout(resolve, 1000));
                await createContact(contactValues)
            } else {
                console.log("updating contact")
                await updateContact(contact.id, contactValues)
            }
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