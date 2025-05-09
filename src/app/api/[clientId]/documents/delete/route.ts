import { DocumentFormValues, createDocument, deleteDocument, getDocumentDAO, getDocumentsDAOByClient, updateDocument } from "@/services/document-services";
import { NextResponse } from "next/server";
import { DocumentResponse } from "../route";
import { getClient } from "@/services/clientService";
import { getSectionCountOfDocument, getSectionOfDocument } from "@/services/section-services";

export const maxDuration = 59
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

        const id= json.id
        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

        const document= await getDocumentDAO(id)
        if (!document) return NextResponse.json({ error: "document not found" }, { status: 400 })

        const sectioinsCount= await getSectionCountOfDocument(id)

        const deleted= await deleteDocument(id)
        if (!deleted) return NextResponse.json({ error: "error deleting document" }, { status: 400 })

        const client= await getClient(clientId)

        const documentResponse: DocumentResponse= {
            id: deleted.id,
            name: deleted.name,
            description: deleted.description || "",
            content: deleted.textContent || "",
            type: deleted.type,
            wordsCount: deleted.wordsCount || 0,
            url: deleted.url || "",
            createdAt: deleted.createdAt.toISOString(),
            clientId: deleted.clientId,
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