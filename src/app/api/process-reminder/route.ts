import { processCampaignContact, setCampaignContactStatus } from "@/services/campaign-services"
import { NextResponse } from "next/server"
import { Receiver } from "@upstash/qstash"
import { CampaignContactStatus, ReminderStatus } from "@prisma/client";
import { processReminder, setReminderStatus } from "@/services/reminder-services";

export const maxDuration = 299

const baseUrl= process.env.NEXTAUTH_URL === "http://localhost:3000" ? "https://local.rctracker.dev" : process.env.NEXTAUTH_URL

export async function POST(request: Request, { params }: { params: { clientId: string } }) {
    let reminderId= null

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
            url: `${baseUrl}/api/process-reminder`,
        })

        if (!isValid) {
            console.error("Signature verification failed")
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
        }

        const body = JSON.parse(rawBody)
        reminderId = body.reminderId;
        if (!reminderId) {
            return NextResponse.json({ error: "reminderId is required" }, { status: 400 })
        }
    
        const processed = await processReminder(reminderId)
        if (!processed) {
            return NextResponse.json({ error: "Error al procesar el recordatorio" }, { status: 500 })
        }

        return NextResponse.json({ message: "Recordatorio procesado" }, { status: 200 })
    } catch (error) {
        console.error("error al procesar el recordatorio en la API")
        if (error instanceof Error) {
            console.error("Error: ", error.message)
        }
        const errorMessage = error instanceof Error ? error.message : "Error desconocido"
        reminderId && await setReminderStatus(reminderId, ReminderStatus.ERROR, errorMessage)
        return NextResponse.json({ error: "Error al procesar el recordatorio" }, { status: 500 })
    }
}

export async function GET(request: Request, { params }: { params: { clientId: string } }) {

    const res= "API is working"


    return NextResponse.json( { "data": res }, { status: 200 })

}

