import { sendMessageToContact } from "@/services/campaign-services";
import { getApiKey } from "@/services/clientService";
import { getContactByPhone, getOrCreateContact } from "@/services/contact-services";
import { createImportedContact, fireProcessPendingContactsAPI, ImportedContactFormValues } from "@/services/imported-contacts-services";
import { getStageByName } from "@/services/stage-services";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

export const maxDuration = 290
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { clientId: string } }) {

    try {
        const clientId = params.clientId
        if (!clientId) return NextResponse.json({ error: "clientId not found" }, { status: 400 })

        const apiKey= await getApiKey(clientId)
        if (!apiKey) return NextResponse.json({ error: "apiKey not found for client" }, { status: 400 })

        const authorization = request.headers.get("authorization")
        if (!authorization) return NextResponse.json({ error: "authorization is required" }, { status: 400 })
        const apiToken= authorization.replace("Bearer ", "")
        if (!apiToken) return NextResponse.json({ error: "apiToken is required" }, { status: 400 })
        if (apiToken !== apiKey) return NextResponse.json({ error: "Bad apiToken" }, { status: 400 })        

        const json= await request.json()
        console.log("json: ", json)

        const jsonContact= json.contact as ContactAPI
        const message= json.message as string
        const tags= jsonContact.tags
        const moveToStageName= jsonContact.stageName
        let moveToStageId= null
        try {            
            console.log("contact: ", jsonContact)

            let stage= undefined
            if (moveToStageName) {
                stage= await getStageByName(clientId, moveToStageName)
                if (stage) {
                    console.log("stage: ", stage.name)
                    moveToStageId= stage.id
                } else {
                    console.log("stage not found: ", moveToStageName)
                }
            } else {
                console.log("no stage name provided")
            }

            const phone= jsonContact.phone?.startsWith("+") ? jsonContact.phone : `+${jsonContact.phone}`

            const contact= await getOrCreateContact(clientId, phone, jsonContact.name)
            if (contact) {
                console.log("contact found: ", contact.name + " " + contact.phone)
                const tagsArray= tags ? tags.split(",") : []
                await sendMessageToContact(clientId, contact, message, tagsArray, moveToStageId, "sendMmessage-API")
                console.log("message sent to contact: ", contact.name)
            } else {
                console.log("contact not found or created: ", jsonContact.phone)
            }
        } catch (error) {
            console.log("error: ", error)
        }

        return NextResponse.json( { "data": "ACK" }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}

type ContactAPI= {
    name: string
    phone: string
    tags?: string
    stageName?: string
}