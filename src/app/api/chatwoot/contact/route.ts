import { getClientIdByChatwootAccountId } from "@/services/clientService";
import { ContactFormValues, createContact, getContactByChatwootId, updateContact } from "@/services/contact-services";
import { NextResponse } from "next/server";


export const maxDuration = 299

export async function POST(request: Request) {

    try {
        // Comprobar que la solicitud tiene contenido
        const contentType = request.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.log("Error en API Chatwoot contact: La solicitud no es de tipo JSON");
            return NextResponse.json({ error: "Content-Type debe ser application/json" }, { status: 400 });
        }

        const text = await request.text();
        if (!text || text.trim() === '') {
            console.log("Error en API Chatwoot contact: Cuerpo de la solicitud vacío");
            return NextResponse.json({ error: "El cuerpo de la solicitud está vacío" }, { status: 400 });
        }

        let json;
        try {
            json = JSON.parse(text);
        } catch (error) {
            console.log("Error en API Chatwoot contact: Error al parsear JSON:", error);
            return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
        }

        //console.log("general api json: ", json)
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
            if (contactValues.src !== "widget-web") {
                await createContact(contactValues)
            }
        } else if (event === "contact_updated") {
            let contact= await getContactByChatwootId(String(json.id), clientId)
            if (!contact) {
                console.log("sleeping 1 second to check if contact was created")
                // sleep 1 second
                await new Promise(resolve => setTimeout(resolve, 1000));
                contact= await getContactByChatwootId(String(json.id), clientId)
                if (!contact) {
                    console.log("contact not found on contact_updated, creating contact")
                    await createContact(contactValues)
                } else {
                    console.log("contact found on contact_updated, updating contact")
                    await updateContact(contact.id, contactValues)
                }
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