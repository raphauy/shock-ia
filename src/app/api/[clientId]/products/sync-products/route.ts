import { getClient } from "@/services/clientService"
import { generateProductEmbeddings, getFeedByClientId, syncProductsFromFeed } from "@/services/product-services"
import { NextResponse } from "next/server"

export const maxDuration = 800;
type Props = {
    params: {
        clientId: string
    }
}

export async function POST(request: Request, { params }: Props) {
    try {
        const authorization = request.headers.get("authorization")
        if (!authorization) return NextResponse.json({ error: "authorization is required" }, { status: 400 })
        const apiToken= authorization.replace("Bearer ", "")
        if (!apiToken) return NextResponse.json({ error: "apiToken is required" }, { status: 400 })
        if (apiToken !== process.env.API_TOKEN) return NextResponse.json({ error: "Bad apiToken" }, { status: 400 })        
    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }

    const clientId= params.clientId
    if (!clientId) return NextResponse.json({ error: "clientId is required" }, { status: 400 })

    const client= await getClient(clientId)
    if (!client) return NextResponse.json({ error: "client not found" }, { status: 404 })

    const body= await request.json()
    const maxProducts= body.maxProducts || 2000
    try {
        const feed= await getFeedByClientId(clientId)
        if (!feed) return NextResponse.json({ error: "feed not found" }, { status: 404 })
        const result= await syncProductsFromFeed(feed.id, maxProducts)
        return NextResponse.json(result, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
}
