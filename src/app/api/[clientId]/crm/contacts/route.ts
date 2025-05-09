import { createImportedContact, fireProcessPendingContactsAPI, ImportedContactFormValues } from "@/services/imported-contacts-services";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

export const maxDuration = 290
export const dynamic = 'force-dynamic'

export async function POST(request: Request, props: { params: Promise<{ clientId: string }> }) {
    const params = await props.params;

    try {
        const authorization = request.headers.get("authorization")
        if (!authorization) return NextResponse.json({ error: "authorization is required" }, { status: 400 })
        const apiToken= authorization.replace("Bearer ", "")
        if (!apiToken) return NextResponse.json({ error: "apiToken is required" }, { status: 400 })
        if (apiToken !== process.env.API_TOKEN) return NextResponse.json({ error: "Bad apiToken" }, { status: 400 })
        
        const clientId = params.clientId
        if (!clientId) return NextResponse.json({ error: "clientId not found" }, { status: 400 })

        const json= await request.json()
        console.log("json: ", json)

        const contacts= json.contacts as ContactAPI[]
        for (const contact of contacts) {            
            try {
                console.log("contact: ", contact)
                const data: ImportedContactFormValues= {
                    name: contact.name,
                    phone: contact.phone,
                    tags: contact.tags,
                    stageName: contact.stageName,
                    type: "API",
                    clientId: clientId
                }
                const created= await createImportedContact(data)
                if (created) {
                    console.log("contacto ingresado: ", created.name)
                } else {
                    console.log("error al ingresar contacto: ", contact.name)
                }
            } catch (error) {
                console.log("error: ", error)
            }
        }

        // fetch the API to process the contacts which is {NEXTAUTH_URL}/api/process-pending-contacts
        // is a POST request with Bearer token: API_TOKEN
        waitUntil(fireProcessPendingContactsAPI())


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