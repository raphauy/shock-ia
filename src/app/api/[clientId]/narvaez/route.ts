import { getNarvaezEntry } from "@/services/narvaez-services";
import { format } from "date-fns";
import { NextResponse } from "next/server";

export const maxDuration = 59
export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: { clientId: string } }) {

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

        console.log("[narvaez API] phone: ", phone)

        const narvaezEntry = await getNarvaezEntry(clientId, phone)
        console.log("[narvaez API] narvaezEntry: ", narvaezEntry)

        if (!narvaezEntry) {
            return NextResponse.json({ data: "Narvaez Entry not found" }, { status: 200 })
        }

        const fecha= narvaezEntry.updatedAt.toLocaleString("es-UY", {timeZone: "America/Montevideo"})

        const data: NarvaezEntryResponse = {
            data: {
                phone,
                clasificacion: narvaezEntry.clasificacion || "",
                consulta: narvaezEntry.consulta || "",
                nombre: narvaezEntry.nombre || "",
                email: narvaezEntry.email || "",
                horarioContacto: narvaezEntry.horarioContacto || "",
                idTrackeo: narvaezEntry.idTrackeo || "",
                urlPropiedad: narvaezEntry.urlPropiedad || "",
                consultaAdicional: narvaezEntry.consultaAdicional || "",
                resumenConversacion: narvaezEntry.resumenPedido || "",
                fecha,
            }
        }

        return NextResponse.json( data, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}

type NarvaezEntryResponse = {
    data:{
        phone: string,
        clasificacion: string,
        consulta: string,
        nombre: string,
        email: string,
        horarioContacto: string,
        idTrackeo: string,
        urlPropiedad: string,
        consultaAdicional: string,
        resumenConversacion: string,        
        fecha: string,
    }
}