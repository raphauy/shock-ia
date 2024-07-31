import { NextResponse } from "next/server";
import { getClient } from "@/services/clientService";
import { sendWapMessage } from "@/services/osomService";

export const maxDuration = 59
export const dynamic = 'force-dynamic'


// json in is like:
// type RepoDataEntryResponse = {
//     id: string,
//     phone: string,
//     repoName: string,
//     functionName: string,
//     clientId: string,
//     clientName: string,
//     date: string,
//     data: String,
// }

export async function POST(request: Request) {

    try {        
        const json= await request.json()
        console.log("json: ", json)

        const clientId= json.clientId
        if (!clientId) return NextResponse.json({ error: "clientId not found" }, { status: 502 })
        const client= await getClient(clientId)
        if (!client) return NextResponse.json({ error: "client not found" }, { status: 502 })

        const whatsappNumbers= client.whatsappNumbers
        if (!whatsappNumbers) return NextResponse.json({ error: "whatsappNumbers not found" }, { status: 502 })
        console.log("whatsappNumbers: ", whatsappNumbers)

        const data= json.data        
        if (!data) return NextResponse.json({ error: "data not found" }, { status: 502 })
        console.log("data: ", data)
    
        const numbers= whatsappNumbers.split(",")
        for (const number of numbers) {
            await sendWapMessage(number, data, false, client.id)
        }
    

        return NextResponse.json( { result: "success", received: json }, { status: 200 })

    } catch (error) {
        console.log("error: ", error)        
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}

