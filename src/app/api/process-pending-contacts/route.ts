import { processPendingImportedContacts } from "@/services/imported-contacts-services";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 800
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {

    try {
        if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 })
        }
    
        const toProcessLeft= await processPendingImportedContacts()
        console.log(`toProcessLeft: ${toProcessLeft}`)

        return NextResponse.json( { "toProcessLeft": toProcessLeft }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}
