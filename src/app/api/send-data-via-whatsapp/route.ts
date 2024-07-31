import { NextResponse } from "next/server";

export const maxDuration = 59
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { clientId: string } }) {

    try {
        console.log("sleeping for 10 seconds")
        await new Promise(resolve => setTimeout(resolve, 10000))
        console.log("continue")
        

        const json= await request.json()
        console.log("json: ", json)


        return NextResponse.json( { result: "success", received: json }, { status: 200 })

    } catch (error) {
        console.log("error: ", error)        
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}

