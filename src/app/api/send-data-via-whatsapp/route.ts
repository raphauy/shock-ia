import { NextResponse } from "next/server";
import { getClient } from "@/services/clientService";
import { sendWapMessage } from "@/services/osomService";
import { camelCaseToNormal, putTildes } from "@/lib/utils";

export const maxDuration = 59
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {

    try {        
        const json= await request.json()
        console.log("json: ", json)

        const clientId= json.clientId
        if (!clientId) return NextResponse.json({ error: "clientId not found" }, { status: 502 })
        const client= await getClient(clientId)
        if (!client) return NextResponse.json({ error: "client not found" }, { status: 502 })

        const whatsappNumbers= client.whatsappNumbers
        if (!whatsappNumbers) return NextResponse.json({ error: "whatsappNumbers not found" }, { status: 400 })
        console.log("whatsappNumbers: ", whatsappNumbers)

        const data= json.data        
        if (!data) return NextResponse.json({ error: "data not found" }, { status: 502 })
        console.log("data: ", data)

        const phone= json.phone
        const repoName= json.repoName

        let text= `Usuario: +${phone}\n`
        text+= "------------------------------------\n"
        text+= `**${repoName}**\n\n`

        const parsedData= JSON.parse(data)
        const keys= Object.keys(JSON.parse(data))
        for (const key of keys) {
            const value = parsedData[key]
            const normalKey = camelCaseToNormal(key)
            const keyWithTildes = putTildes(normalKey)
            text += `**${keyWithTildes}**: ${value}\n`
        }
        console.log("text: ", text)
        

        const numbers= whatsappNumbers.split(",")
        for (const number of numbers) {
            await sendWapMessage(number, text, false, client.id)
        }
    

        return NextResponse.json( { result: "success", received: json }, { status: 200 })

    } catch (error) {
        console.log("error: ", error)        
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}

