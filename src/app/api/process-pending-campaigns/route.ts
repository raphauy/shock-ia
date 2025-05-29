import { processPendingCampaigns } from "@/services/campaign-services";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 800
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {

    try {
        if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 })
        }

        const processedCampaigns= await processPendingCampaigns()
        console.log(`processedCampaigns: ${processedCampaigns}`)

        return NextResponse.json( { "processedCampaigns": processedCampaigns }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}
