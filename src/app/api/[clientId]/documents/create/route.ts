import { DocumentFormValues, createDocument, getDocumentsDAOByClient } from "@/services/document-services";
import { NextResponse } from "next/server";
import { DocumentResponse } from "../route";
import { getClient } from "@/services/clientService";
import { getSectionCountOfDocument, getSectionOfDocument } from "@/services/section-services";


export async function POST(request: Request, { params }: { params: { clientId: string } }) {

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

        const name= json.name
        if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

        const description= json.description
        const content= json.content

        const wordsCount= content.split(" ").length
        const textContent= content
        const jsonContent= getJsonContent(content)
        const formValues: DocumentFormValues= {
            name,
            description,
            jsonContent: JSON.stringify(jsonContent),
            textContent,
            wordsCount, 
            clientId
        }

        const document= await createDocument(formValues)
        if (!document) return NextResponse.json({ error: "error creating document" }, { status: 400 })

        const client= await getClient(clientId)
        const sectioinsCount= await getSectionCountOfDocument(document.id)

        const documentResponse: DocumentResponse= {
            id: document.id,
            name: document.name,
            description: document.description || "",
            content: document.textContent || "",
            type: document.type,
            wordsCount: document.wordsCount || 0,
            url: document.url || "",
            createdAt: document.createdAt.toISOString(),
            clientId: document.clientId,
            clientName: client?.name || "",
            sectioinsCount
        }
        
        return NextResponse.json( { "data": documentResponse }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}


type SummitEntryResponse = {
    data:{
        phone: string,
        nombreReserva: string | null,
        nombreCumpleanero: string | null,
        cantidadInvitados: number | null,
        fechaReserva: string | null,
        email: string | null,
        resumenConversacion: string | null,
        fecha: string,
    }
}

function getJsonContent(content: string) {
    const json= {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":content}]}]}
    return json
    
}