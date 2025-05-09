import { getNarvaezEntry } from "@/services/narvaez-services";
import { getSummitEntry } from "@/services/summit-services";
import { format } from "date-fns";
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

        const json= await request.json()
        const message= json.message
        console.log("json: ", json)
        console.log("message: ", message)

        const phone = message.phone
        if (!phone) {
            return NextResponse.json({ error: "phone is required" }, { status: 400 })
        }

        console.log("[summit API] phone: ", phone)

        const summitEntry = await getSummitEntry(clientId, phone)
        console.log("[summit API] summitEntry: ", summitEntry)

        if (!summitEntry) {
            return NextResponse.json({ data: "Summit Entry not found" }, { status: 200 })
        }

        const fecha= summitEntry.updatedAt.toLocaleString("es-UY", {timeZone: "America/Montevideo"})

        const data: SummitEntryResponse = {
            data: {
                phone,
                nombreReserva: summitEntry.nombreReserva,
                nombreCumpleanero: summitEntry.nombreCumpleanero,
                cantidadInvitados: summitEntry.cantidadInvitados,
                fechaReserva: summitEntry.fechaReserva,
                email: summitEntry.email,
                resumenConversacion: summitEntry.resumenConversacion,
                fecha,
            }
        }

        return NextResponse.json( data, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
}


// model Summit {
//     id                  String        @id @default(cuid())
//     nombreReserva       String?       @default("")           // gennext: show.column
//     nombreCumpleanero   String?       @default("")             // gennext: show.column
//     cantidadInvitados   Int?          @default(0)              // gennext: show.column
//     fechaReserva        String?       @default("")          // gennext: show.column
//     email               String?       @default("")           // gennext: show.column
//     resumenConversacion String?       @default("")              // gennext: show.column
  
//     createdAt           DateTime     @default(now())         // gennext: skip.zod
//     updatedAt           DateTime     @updatedAt              // gennext: skip.zod show.column
  
//     conversation        Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
//     conversationId     String @unique
//   }
type SummitEntryResponse = {
    data:{
        phone: string,
        nombreReserva: string | null,
        nombreCumpleanero: string | null,
        cantidadInvitados: number | null,
        fechaReserva: string | null,
        email: string | null,
        resumenConversacion: string | null,
        fecha: string,
    }
}