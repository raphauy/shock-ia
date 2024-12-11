import { processCampaignContact } from "@/services/campaign-services"
import { NextResponse } from "next/server"
import { Receiver } from "@upstash/qstash"

const baseUrl= process.env.NEXTAUTH_URL === "http://localhost:3000" ? "https://local.rctracker.dev" : process.env.NEXTAUTH_URL

export async function POST(request: Request, { params }: { params: { clientId: string } }) {
    try {
        const receiver = new Receiver({
            currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
            nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!
        })

        const rawBody = await request.text()
        const signature = request.headers.get("Upstash-Signature") || ""

        const isValid = await receiver.verify({
            body: rawBody,
            signature,
            url: `${baseUrl}/api/process-campaign-message`,
        })

        if (!isValid) {
            console.error("Signature verification failed")
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
        }

        const body = JSON.parse(rawBody)

        const campaignContactId = body.campaignContactId;
        if (!campaignContactId) {
            return NextResponse.json({ error: "campaignContactId is required" }, { status: 400 })
        }

        const processed = await processCampaignContact(campaignContactId)
        if (!processed) {
            return NextResponse.json({ error: "Error al procesar el mensaje" }, { status: 500 })
        }

        return NextResponse.json({ message: "Message processed" }, { status: 200 })
    } catch (error) {
        console.error("error: ", error)
        return NextResponse.json({ error: "Error al procesar el mensaje" }, { status: 500 })
    }
}

export async function GET(request: Request, { params }: { params: { clientId: string } }) {

    const res= "API is working"


    return NextResponse.json( { "data": res }, { status: 200 })

}

