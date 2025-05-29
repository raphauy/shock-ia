import { processPendingCampaigns } from "@/services/campaign-services";
import { NextResponse } from "next/server";

export const maxDuration = 290
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {

    try {
        const authorization = request.headers.get("authorization")
        if (!authorization) return NextResponse.json({ error: "authorization is required" }, { status: 400 })
        const apiToken= authorization.replace("Bearer ", "")
        if (!apiToken) return NextResponse.json({ error: "apiToken is required" }, { status: 400 })
        if (apiToken !== process.env.API_TOKEN) return NextResponse.json({ error: "Bad apiToken" }, { status: 400 })

        const processedCampaigns= await processPendingCampaigns()
        console.log(`processedCampaigns: ${processedCampaigns}`)

        return NextResponse.json( { "processedCampaigns": processedCampaigns }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}
