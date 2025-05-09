import { getDocumentsByClient } from "@/services/document-services";
import { NextResponse } from "next/server";

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

        const documents= await getDocumentsByClient(clientId)

        const dataDocuments: DocumentResponse[]= documents.map((document) => ({
            id: document.id,
            name: document.name,
            description: document.description || "",
            content: document.textContent || "",
            type: document.type,
            wordsCount: document.wordsCount || 0,
            url: document.url || "",
            createdAt: document.createdAt.toISOString(),
            clientId: document.clientId,
            clientName: document.client.name,
            sectioinsCount: document.sections.length
        }))


        return NextResponse.json( { "data": dataDocuments }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
}

export type DocumentResponse= {
    id: string
    name: string
    description: string
    content: string
    type: string
    wordsCount: number
    url: string
    createdAt: string
    clientId: string
    clientName: string
    sectioinsCount: number
}